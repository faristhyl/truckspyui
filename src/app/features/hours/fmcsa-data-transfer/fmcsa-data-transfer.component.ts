import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import * as moment from 'moment';
import * as fileSaver from 'file-saver';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { FilterFmcsaDataTransferOption, RestService, Driver } from '@app/core/services';

@Component({
  selector: 'app-fmcsa-data-transfer',
  templateUrl: './fmcsa-data-transfer.component.html',
  styleUrls: ['./fmcsa-data-transfer.component.css']
})
export class FmcsaDataTransferComponent implements OnInit {

  @ViewChild('fmcsaSubmitModal') fmcsaSubmitModal: TemplateRef<any>;

  drivers = [];
  vehicles = [];
  defaultVehicles = [];
  filterOption: FilterFmcsaDataTransferOption;
  isDownloadBtnDisabled: boolean;
  isVehicleDisabled: boolean;
  multiSubmitResponse = [];
  constructor(
    private restService: RestService,
    private modalService: BsModalService,
  ) {
    let prevDate = new Date();
    prevDate.setDate(prevDate.getDate() - 6);
    let currentDate = new Date();
    this.filterOption = new FilterFmcsaDataTransferOption();
    this.filterOption = {
      dateRange: [
        prevDate,
        currentDate
      ],
      ISODateRange: [],
      selectedDriverId: [],
      selectedVehicleId: [],
      comment: ''
    }
    this.isDownloadBtnDisabled = true;
    this.isVehicleDisabled = false;
  }

  ngOnInit() {
    this.getAllDrivers();
    this.getAllVehicles();
  }

  getAllDrivers() {
    this.restService.getAllDriversForHOS().subscribe(data => {
      this.drivers = data;
    });
  }

  getAllVehicles() {
    this.restService.getAllVehiclesForHOS().subscribe(val => {
      this.vehicles = val;
      this.defaultVehicles = [...val];
    })
  }

  getVehiclesDrivenByDriverId() {
    this.restService.getVehiclesDrivenByDriverId(this.filterOption.selectedDriverId)
      .subscribe(response => {
        this.vehicles = this.defaultVehicles.filter(v => response['Vehicles Driven'].includes(v.id));
        this.isVehicleDisabled = false;
      })
  }

  onDriverChange() {
    if (this.filterOption.selectedDriverId.length > 0) {
      this.isVehicleDisabled = true;
      this.filterOption.selectedVehicleId = [];
      this.getVehiclesDrivenByDriverId();
    } else {
      this.getAllVehicles();
      this.isVehicleDisabled = false;
    }

    this.isDownloadBtnDisabled = this.filterOption.selectedDriverId.length != 1;

  }

  onSelectAllDrivers() {
    this.isDownloadBtnDisabled = true;
    this.filterOption.selectedDriverId = this.drivers.map(d => d.id);
    this.isVehicleDisabled = true;
    this.filterOption.selectedVehicleId = [];
    this.getVehiclesDrivenByDriverId();
  }

  onSelectAllVehicles() {
    this.filterOption.selectedVehicleId = this.vehicles.map(v => v.id);
  }

  /**
   * Upload Document File modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _fmcsaSubmitModal: BsModalRef;
  onFMCSASubmit() {
    let filterOption: FilterFmcsaDataTransferOption = this.setFilterData(this.filterOption);
    this.restService.fmcsaMultipleSubmit(filterOption)
      .subscribe((response: any) => {
        this.multiSubmitResponse = response;
        this._fmcsaSubmitModal = this.modalService.show(this.fmcsaSubmitModal, { class: "modal-lg", ignoreBackdropClick: true })
      }, error => {
        this._fmcsaSubmitModal = this.modalService.show(this.fmcsaSubmitModal, { class: "modal-lg", ignoreBackdropClick: true })
      })
  }

  onCloseFmcsaSubmitModal() {
    this._fmcsaSubmitModal.hide();
  }

  setFilterData(filterOption) {
    let newFilterOption: FilterFmcsaDataTransferOption;
    newFilterOption = Object.assign({}, filterOption);
    if (newFilterOption.selectedDriverId.length == 0)
      newFilterOption.selectedDriverId = this.drivers.map(d => d.id).slice(0, 10);

    if (newFilterOption.selectedVehicleId.length == 0)
      newFilterOption.selectedVehicleId = this.vehicles.map(v => v.id);

    newFilterOption = this.convertFilterDateToISODate(newFilterOption);
    return newFilterOption;
  }

  convertFilterDateToISODate(filterOption: FilterFmcsaDataTransferOption) {
    filterOption.ISODateRange[0] = moment(filterOption.dateRange[0]).toISOString();
    filterOption.ISODateRange[1] = moment(filterOption.dateRange[1]).toISOString();
    return filterOption;
  }

  onDownloadCSV() {
    let filterOption: FilterFmcsaDataTransferOption = this.setFilterData(this.filterOption);
    this.restService.driverHistoriesExport(filterOption)
      .subscribe(response => {
        fileSaver(response, this.generateFileName('csv'));
      }, error => {
        if (error.error.code === 3100) {
          this.restService.notifyError(error.error.message)
        }
      })
  }

  generateFileName(fileType) {
    let driverName: Driver = this.drivers.find(d => d.id === this.filterOption.selectedDriverId[0]);
    return `${driverName ? driverName.lastName : 'file'}.${fileType}`;
  }
}
