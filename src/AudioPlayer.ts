import {EventEmitter} from "events";
import {AudioItem} from "./AudioItem";
import {SkillInteractor} from "./SkillInteractor";
import {RequestType, SessionEndedReason, SkillRequest} from "./SkillRequest";

export enum AudioPlayerActivity {
    BUFFER_UNDERRUN,
    FINISHED,
    IDLE,
    PLAYING,
    PAUSED,
    STOPPED,
}

/**
 * Emulates the behavior of the audio player
 */
export class AudioPlayer {
    public static DIRECTIVE_PLAY = "AudioPlayer.Play";
    public static DIRECTIVE_STOP = "AudioPlayer.Stop";
    public static DIRECTIVE_CLEAR_QUEUE = "AudioPlayer.ClearQueue";

    public static PLAY_BEHAVIOR_REPLACE_ALL = "REPLACE_ALL";
    public static PLAY_BEHAVIOR_ENQUEUE = "ENQUEUE";
    public static PLAY_BEHAVIOR_REPLACE_ENQUEUED = "REPLACE_ENQUEUED";

    private _emitter: EventEmitter = null;
    private _playing: AudioItem = null;
    private _queue: AudioItem[] = [];
    private _activity: AudioPlayerActivity = null;
    private _suspended: boolean = false;

    public constructor(public skillInstance: SkillInteractor) {
        this._activity = AudioPlayerActivity.IDLE;
        this._emitter = new EventEmitter();
    }

    public enqueue(audioItem: AudioItem, playBehavior: string) {
        if (playBehavior === AudioPlayer.PLAY_BEHAVIOR_ENQUEUE) {
            this._queue.push(audioItem);

        } else if (playBehavior === AudioPlayer.PLAY_BEHAVIOR_REPLACE_ALL) {
            if (this.isPlaying()) {
                this.playbackStopped();
            }

            this._queue = [];
            this._queue.push(audioItem);

        } else if (playBehavior === AudioPlayer.PLAY_BEHAVIOR_REPLACE_ENQUEUED) {
            this._queue = [];
            this._queue.push(audioItem);
        }

        if (!this.isPlaying()) {
            this.playNext();
        }
    }

    public activity(): AudioPlayerActivity {
        return this._activity;
    }

    public playNext() {
        if (this._queue.length === 0) {
            return;
        }

        this._playing = this.dequeue();
        // If the URL for AudioItem is http, we throw an error
        if (this._playing.stream.url.startsWith("http:")) {
            this.skillInstance.sessionEnded(SessionEndedReason.ERROR, {
                message: "The URL specified in the Play directive must be HTTPS",
                type: "INVALID_RESPONSE",
            });
        } else {
            this.playbackStarted();

        }
    }

    public suspend() {
        this._suspended = true;
        this.playbackStopped();
    }

    public suspended(): boolean {
        return this._suspended;
    }

    /**
     * Emulates a certain amount of a track being played back
     * @param offset
     */
    public playbackOffset(offset: number) {
        if (this.isPlaying()) {
            this.playing().stream.offsetInMilliseconds = offset;
        }
    }

    public on(audioPlayerRequest: string, listener: (...args: any[]) => void) {
        this._emitter.on(audioPlayerRequest, listener);
    }

    public once(audioPlayerRequest: string, listener: (...args: any[]) => void) {

        this._emitter.once(audioPlayerRequest, listener);
    }

    public resume() {
        this._suspended = false;
        this.playbackStarted();
    }

    public playbackNearlyFinished(): Promise<any> {
        return this.audioPlayerRequest(RequestType.AUDIO_PLAYER_PLAYBACK_NEARLY_FINISHED);
    }

    public playbackFinished(): Promise<any> {
        this._activity = AudioPlayerActivity.FINISHED;

        const promise = this.audioPlayerRequest(RequestType.AUDIO_PLAYER_PLAYBACK_FINISHED);

        // Go the next track, if there is one
        this.playNext();
        return promise;
    }

    public playbackStarted(): Promise<any> {
        this._activity = AudioPlayerActivity.PLAYING;
        return this.audioPlayerRequest(RequestType.AUDIO_PLAYER_PLAYBACK_STARTED);
    }

    public playbackStopped(): Promise<any> {
        this._activity = AudioPlayerActivity.STOPPED;
        return this.audioPlayerRequest(RequestType.AUDIO_PLAYER_PLAYBACK_STARTED);
    }

    public playing(): AudioItem {
        return this._playing;
    }

    public directivesReceived(directives: any[]): void {
        for (const directive of directives) {
            this.handleDirective(directive);
        }
    }

    public isPlaying(): boolean {
        return (this._activity === AudioPlayerActivity.PLAYING);
    }

    private audioPlayerRequest(requestType: string): Promise<any> {
        const nowPlaying = this.playing();
        const serviceRequest = new SkillRequest(this.skillInstance.context());
        serviceRequest.audioPlayerRequest(requestType, nowPlaying.stream.token, nowPlaying.stream.offsetInMilliseconds);
        return this.skillInstance.callSkill(serviceRequest);
    }

    private handleDirective(directive: any) {
        // Handle AudioPlayer.Play
        if (directive.type === AudioPlayer.DIRECTIVE_PLAY) {
            const audioItem = new AudioItem(directive.audioItem);
            const playBehavior: string = directive.playBehavior;
            this.enqueue(audioItem, playBehavior);

        } else if (directive.type === AudioPlayer.DIRECTIVE_STOP) {
            if (this.suspended()) {
                this._suspended = false;
            } else if (this.playing()) {
                this.playbackStopped();
            }
        }
    }

    private dequeue(): AudioItem {
        const audioItem = this._queue[0];
        this._queue = this._queue.slice(1);
        return audioItem;
    }
}
