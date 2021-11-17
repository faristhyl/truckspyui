import { Router } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';

import { RestService, Message, MessageImage } from '@app/core/services';
import { MessagesService, ALL_DRIVERS } from '../shared/messages.service';
import * as fileSaver from 'file-saver';
import { ModalDirective } from 'ngx-bootstrap';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit {

  driverName: string = "";
  message: Message;
  fromDriver: boolean = false;

  selectedImage: string;
  selectedImageIndex: number;
  /**
   * Acknowledge logic.
   */
  acknowledging: boolean = false;
  acknowledge() {
    this.restService.acknowledgeMessage(this.message.id)
      .subscribe(
        success => {
          this.message.markAcknowledged();
          this.messagesService.storeMessage(this.message);
          this.acknowledging = false; // no need in this, just for consistency
        },
        error => {
          this.acknowledging = false;
        }
      );
  }

  /**
   * Acknowledge logic.
   */
  archiving: boolean = false;
  archive() {
    this.restService.archiveMultipleMessages([this.message.id])
      .subscribe(
        success => {
          this.message.markArchived();
          this.messagesService.storeMessage(this.message);
          this.archiving = false; // no need in this, just for consistency
        },
        error => {
          this.archiving = false;
        }
      );
  }

  /**
   * Acknowledge logic.
   */
  unarchiving: boolean = false;
  unarchive() {
    this.restService.unarchiveMultipleMessages([this.message.id])
      .subscribe(
        success => {
          this.message.markUnarchived();
          this.messagesService.storeMessage(this.message);
          this.unarchiving = false; // no need in this, just for consistency
        },
        error => {
          this.unarchiving = false;
        }
      );
  }

  /**
   * Reply logic.
   */
  reply: boolean = false;
  replyData: any = {
    subject: "",
    body: ""
  };

  discardReply() {
    this.reply = false;
    this.replyData = this.messagesService.replyMessage(this.message);
  }

  drafting: boolean = false;
  sending: boolean = false;
  resetButtons() {
    this.drafting = false;
    this.sending = false;
  }

  createReplyMessage() {
    let isDraft = this.drafting;
    let messageData = {
      ...this.replyData,
      draft: isDraft
    }

    this.restService.createMessage(messageData)
      .subscribe(
        success => {
          this.resetButtons();
          let path = isDraft ? "/messages/draft" : "/messages/sent";
          this.router.navigate([path]);
        },
        error => {
          this.resetButtons();
        }
      );
  }

  /**
   * Constructor to instantiate an instance of DetailsComponent.
   */
  constructor(
    private router: Router,
    private restService: RestService,
    private messagesService: MessagesService) { }

  imageSources: any[];
  blobToImage(image: Blob, index: number, source) {
    const self = this;
    let reader = new FileReader();
    reader.addEventListener("load", () => {
      self[source][index] = reader.result;
    }, false);

    if (image) {
      reader.readAsDataURL(image);
    }
  }
  isVideo(imageSource: string) {
    return !!imageSource && imageSource.startsWith("data:video");
  }
  isImage(imageSource: string) {
    return !!imageSource && imageSource.startsWith("data:image");
  }

  ngOnInit() {
    let self = this;

    this.message = this.messagesService.getMessage();
    if (!this.message) {
      this.router.navigate(["/messages/inbox"]);
    }

    const messageId = this.message.id;
    if (this.message.images && this.message.images.length > 0) {
      this.imageSources = new Array(this.message.images.length);
      this.message.images.forEach(function (image: MessageImage, index: number) {
        self.restService.getMessageImage(messageId, image.id)
          .subscribe(
            blob => {
              self.blobToImage(blob, index, "imageSources");
            },
            error => {
              console.log(`Error loading image with ID: ${image.id}`);
            });
      });
    }

    this.reply = this.messagesService.isReply();
    this.replyData = this.messagesService.replyMessage(this.message);

    this.fromDriver = this.message.fromDriver();
    if (this.fromDriver && !this.message.read) { // let's mark message as read
      this.restService.readMessage(messageId)
        .subscribe(success => { /* do nothing */ });
    }
    let driverId = this.fromDriver ? this.message.senderId : this.message.receiverId;

    if (!driverId) {
      this.driverName = ALL_DRIVERS;
    } else {
      this.restService.getDriver(driverId)
        .subscribe(
          driver => {
            this.driverName = this.messagesService.getDriverName([driver], driverId);
          }
        );
    }
  }

  /**
   * Image modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("imageModal") _imageModal: ModalDirective;
  isSelectedImage: boolean;

  showImageModal(selectedImage = null, index = null) {
    this.selectedImage = selectedImage;
    this.selectedImageIndex = index ? ++index : 1;
    this.isSelectedImage = this.isImage(this.selectedImage);
    this._imageModal.show();
  }

  onDownloadImage() {
    let currentDate = new Date();
    let dateString = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
    fileSaver(this.selectedImage, `message_detail_${this.selectedImageIndex}_${dateString}.${this.isSelectedImage ? "jpg" : "mp4"}`);
  }

  closeImageModal() {
    this._imageModal.hide();
  }

}
