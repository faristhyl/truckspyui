import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { AlertVideo } from '@app/core/services';
import {  BsModalRef } from 'ngx-bootstrap/modal';

declare var $: any;

@Component({
    selector: 'app-videos-view',
    templateUrl: './videos-view.component.html',
    styleUrls: ['./videos-view.component.css']
})
export class VideosViewComponent implements OnInit, OnDestroy {

    @Input() videos: AlertVideo[][];

    constructor( private viewAlertModal: BsModalRef ) {}

    ngOnInit() {
        // define namespace functions
        window.truckspy = window.truckspy || {};
        window.truckspy.onPlay = this.onPlay.bind(this);
        window.truckspy.onPause = this.onPause.bind(this);
        window.truckspy.onSeeked = this.onSeeked.bind(this);
    }

    ngOnDestroy() {
        window.truckspy.onPlay = null;
        window.truckspy.onPause = null;
        window.truckspy.onSeeked = null;
    }

    @ViewChild('videoPlayer') videoPlayer: ElementRef;
    /**
     * Rearanges videos to make `#index` to be the primary one.
     */
    prioritizeVideo(videoIndex: number, groupIndex: number) {
        // const currentTime = this.videoPlayer.nativeElement.currentTime;

        let result = [...this.videos[groupIndex]];
        let temp = result[videoIndex];
        result[videoIndex] = result[0];
        result[0] = temp;
        this.videos[groupIndex] = [...result];

        // setTimeout(() => {
        //     this.videoPlayer.nativeElement.currentTime = currentTime;
        //     $('.alert-small-video-marker').each(function (index, element) {
        //         element.currentTime = currentTime;
        //     });
        // }, 2000);
    }

    onPause() {
        $('.alert-small-video-marker').each(function (index, element) {
            element.pause();
        });
    }
    onPlay() {
        $('.alert-small-video-marker').each(function (index, element) {
            element.play();
        });
    }
    onSeeked() {
        const currentTime = this.videoPlayer.nativeElement.currentTime;
        $('.alert-small-video-marker').each(function (index, element) {
            element.currentTime = currentTime;
        });
    }

    closeAlertViewModal(): void {
        this.viewAlertModal.hide();
    }

}
