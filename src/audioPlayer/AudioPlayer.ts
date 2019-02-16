import {RequestType, SessionEndedReason, SkillRequest} from "../core/SkillRequest";
import {SkillInteractor} from "../impl/SkillInteractor";
import {AudioItem} from "./AudioItem";
import { VirtualAlexa } from "../core/VirtualAlexa";

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
    private _playing: AudioItem = null;

    /** @internal */
    private _queue: AudioItem[] = [];

    /** @internal */
    private _activity: AudioPlayerActivity = null;

    /** @internal */
    private _suspended: boolean = false;

    /** @internal */
    public constructor(private _alexa: VirtualAlexa) {
        this._activity = AudioPlayerActivity.IDLE;
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
    public async resume() {
        this._suspended = false;
        if (!this.isPlaying()) {
            await this.playbackStarted();
        }
    }

    /**
     * Emulates the device stopping playback while handling an utterance
     */
    public async suspend() {
        this._suspended = true;
        await this.playbackStopped();
    }

    /**
     * Is the AudioPlayer stopped due to handling an utterance
     * @returns {boolean}
     */
    public suspended(): boolean {
        return this._suspended;
    }

    /** @internal */
    public async directivesReceived(directives: any[]) {
        for (const directive of directives) {
            await this.handleDirective(directive);
        }
    }

    private async audioPlayerRequest(requestType: string): Promise<any> {
        const nowPlaying = this.playing();
        const serviceRequest = new SkillRequest(this._alexa);
        serviceRequest.audioPlayer(requestType, nowPlaying.stream.token, nowPlaying.stream.offsetInMilliseconds);
        return serviceRequest.send();
    }

    private async enqueue(audioItem: AudioItem, playBehavior: string): Promise<void> {
        if (playBehavior === AudioPlayer.PLAY_BEHAVIOR_ENQUEUE) {
            this._queue.push(audioItem);

        } else if (playBehavior === AudioPlayer.PLAY_BEHAVIOR_REPLACE_ALL) {
            if (this.isPlaying()) {
                await this.playbackStopped();
            }

            this._queue = [];
            this._queue.push(audioItem);

        } else if (playBehavior === AudioPlayer.PLAY_BEHAVIOR_REPLACE_ENQUEUED) {
            this._queue = [];
            this._queue.push(audioItem);
        }

        if (!this.isPlaying()) {
            await this.playNext();
        }
    }

    private async handleDirective(directive: any) {
        // Handle AudioPlayer.Play
        if (directive.type === AudioPlayer.DIRECTIVE_PLAY) {
            const audioItem = new AudioItem(directive.audioItem);
            const playBehavior: string = directive.playBehavior;
            await this.enqueue(audioItem, playBehavior);

        } else if (directive.type === AudioPlayer.DIRECTIVE_STOP) {
            if (this.suspended()) {
                this._suspended = false;
            } else if (this.playing()) {
                await this.playbackStopped();
            }
        }
    }

    private dequeue(): AudioItem {
        const audioItem = this._queue[0];
        this._queue = this._queue.slice(1);
        return audioItem;
    }

    private async playNext() {
        if (this._queue.length === 0) {
            return;
        }

        this._playing = this.dequeue();
        // If the URL for AudioItem is http, we throw an error
        if (!this._playing.stream.url) {
            return this._alexa.endSession(SessionEndedReason.ERROR, {
                message: "The URL specified in the Play directive must be defined and a valid HTTPS url",
                type: "INVALID_RESPONSE",
            });  
        } else if (this._playing.stream.url.startsWith("http:")) {
            return this._alexa.endSession(SessionEndedReason.ERROR, {
                message: "The URL specified in the Play directive must be HTTPS",
                type: "INVALID_RESPONSE",
            });
        } else {
            return this.playbackStarted();

        }
    }
}
