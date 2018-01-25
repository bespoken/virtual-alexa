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
    /** @internal */
    private static DIRECTIVE_PLAY = "AudioPlayer.Play";

    /** @internal */
    private static DIRECTIVE_STOP = "AudioPlayer.Stop";

    /** @internal */
    private static DIRECTIVE_CLEAR_QUEUE = "AudioPlayer.ClearQueue";

    /** @internal */
    private static PLAY_BEHAVIOR_REPLACE_ALL = "REPLACE_ALL";

    /** @internal */
    private static PLAY_BEHAVIOR_ENQUEUE = "ENQUEUE";

    /** @internal */
    private static PLAY_BEHAVIOR_REPLACE_ENQUEUED = "REPLACE_ENQUEUED";

    /** @internal */
    private _interactor: SkillInteractor;

    /** @internal */
    private _playing: AudioItem = null;

    /** @internal */
    private _queue: AudioItem[] = [];

    /** @internal */
    private _activity: AudioPlayerActivity = null;

    /** @internal */
    private _suspended: boolean = false;

    /** @internal */
    public constructor(_interactor: SkillInteractor) {
        this._activity = AudioPlayerActivity.IDLE;
        this._interactor = _interactor;
    }

    /**
     * Convenience method to check if the AudioPlayer is playing
     * @returns {boolean}
     */
    public isPlaying(): boolean {
        return (this._activity === AudioPlayerActivity.PLAYING);
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
        return this.audioPlayerRequest(RequestType.AUDIO_PLAYER_PLAYBACK_STOPPED);
    }

    /**
     * The current state of the AudioPlayer
     * @returns {AudioPlayerActivity}
     */
    public playerActivity(): AudioPlayerActivity {
        return this._activity;
    }

    /**
     * The currently playing track
     * @returns {AudioItem}
     */
    public playing(): AudioItem {
        return this._playing;
    }

    /**
     * Emulates the device begin playback again after finishing handling an utterance
     */
    public resume() {
        this._suspended = false;
        if (!this.isPlaying()) {
            this.playbackStarted();
        }
    }

    /**
     * Emulates the device stopping playback while handling an utterance
     */
    public suspend() {
        this._suspended = true;
        this.playbackStopped();
    }

    /**
     * Is the AudioPlayer stopped due to handling an utterance
     * @returns {boolean}
     */
    public suspended(): boolean {
        return this._suspended;
    }

    /** @internal */
    public directivesReceived(directives: any[]): void {
        for (const directive of directives) {
            this.handleDirective(directive);
        }
    }

    private async audioPlayerRequest(requestType: string): Promise<any> {
        const nowPlaying = this.playing();
        const serviceRequest = new SkillRequest(this._interactor.context());
        serviceRequest.audioPlayerRequest(requestType, nowPlaying.stream.token, nowPlaying.stream.offsetInMilliseconds);
        return this._interactor.callSkill(serviceRequest);
    }

    private enqueue(audioItem: AudioItem, playBehavior: string) {
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

    private playNext() {
        if (this._queue.length === 0) {
            return;
        }

        this._playing = this.dequeue();
        // If the URL for AudioItem is http, we throw an error
        if (this._playing.stream.url.startsWith("http:")) {
            this._interactor.sessionEnded(SessionEndedReason.ERROR, {
                message: "The URL specified in the Play directive must be HTTPS",
                type: "INVALID_RESPONSE",
            });
        } else {
            this.playbackStarted();

        }
    }
}
