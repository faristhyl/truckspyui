import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { RestService, SearchResult, Event } from '@app/core/services';
import { combineLatest } from 'rxjs';

import { LayoutService } from '@app/core/services/layout.service';

@Component({
  selector: 'sa-search-switcher',
  templateUrl: './search-switcher.component.html'
})
export class SearchSwitcherComponent implements OnInit, OnDestroy {

  isActivated: boolean;
  selectedTab: number = 0;
  tabs: Array<string> = ['Tab1'];

  vehicleEventsTypes: Array<string> = [];
  driverEventsTypes: Array<string> = [];
  deviceEventsTypes: Array<string> = [];
  typesData: {
    types: Array<string>,
    label: string
  }[] = [];

  selectedEventsTypes: Array<Array<string>> = [[]];
  selectedEventsTypesCache: Array<Array<string>> = [[]];
  typesLoaded: boolean = false;

  searchTexts: Array<string> = [];
  searchInitiated: Array<boolean> = [false];
  isEventsView: Array<boolean> = [false];
  itemsClicked: Array<SearchResult> = [null];
  searchResults: Array<SearchResult[]> = [];
  currentPageNums: Array<number> = [1];
  searchPageNums: Array<number> = [0];

  constructor(
    public layoutService: LayoutService,
    private restService: RestService) { }

  ngOnInit() {
    // this.sub = this.layoutService.subscribe((store)=>{
    //   this.store = store;
    // });
    // this.store = this.layoutService.store;

    this.layoutService.searchUpdated.subscribe(active => {
      this.isActivated = active;

      if (this.isActivated) {
        this.doReloadEvents();
      }
    });

    combineLatest(
      this.restService.getVehicleEventsType(),
      this.restService.getDriverEventsType(),
      this.restService.getDeviceEventsType()
    ).subscribe(
      data => {
        this.vehicleEventsTypes = data[0];
        this.driverEventsTypes = data[1];
        this.deviceEventsTypes = data[2];

        this.typesData = [
          { types: this.vehicleEventsTypes, label: "Vehicle Events" },
          { types: this.driverEventsTypes, label: "Driver Events" },
          { types: this.deviceEventsTypes, label: "Device Events" }
        ];
        this.typesLoaded = true;
      });
  }

  ngOnDestroy() {
    // this.sub.unsubscribe()
  }

  onToggle() {
    this.isActivated = !this.isActivated;
    this.layoutService.onSearchActivate(this.isActivated);
    this.layoutService.onLayoutActivate(false);
  }

  onTabSelect(index) {
    this.selectedTab = index;
  }

  @ViewChild("scrollbarRef") scrollbarRef: any;
  onAddTab() {
    let newTab = this.tabs.length;
    this.tabs.push(`Tab${newTab + 1}`);
    this.searchInitiated.push(false);
    this.isEventsView.push(false);
    this.itemsClicked.push(null);
    this.eventResultsLoaded.push(false);

    this.selectedTab = newTab;
    this.selectedEventsTypes[newTab] = [];
    this.selectedEventsTypesCache[newTab] = [];

    setTimeout(() => {
      this.scrollbarRef.scrollToRight();
      this.scrollbarRef.update();
    }, 100);
  }

  onSearch(index) {
    this.searchInitiated[index] = true;
    this.restService.getSearchResults(this.searchTexts[index])
      .subscribe(
        results => {
          this.searchResults[index] = results;
          this.isEventsView[index] = false;
          this.itemsClicked[index] = null;
          this.eventResultsLoaded[index] = false;
          this.currentPageNums[index] = 1;
          this.searchPageNums[index] = Math.ceil(results.length / 5);
        }
      );
  }

  filtersOpened(i) {
    this.selectedEventsTypesCache[i] = [...this.selectedEventsTypes[i]];
  }

  filtersClosed(i) {
    let self = this;
    const same = (this.selectedEventsTypesCache[i].length === this.selectedEventsTypes[i].length)
      && this.selectedEventsTypesCache[i].every(function (element, index) {
        return self.selectedEventsTypes[i].includes(element);
      });

    if (same) {
      console.log("Filters not changed");
    }
    if (!same && this.isEventsView[i]) {
      this.onItemClicked(this.itemsClicked[i], i);
    }
  }

  onTypesChecked(e, types, tabIndex) {
    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index;
    }

    const checked = e.target.checked;
    if (checked) {
      this.selectedEventsTypes[tabIndex] = [...this.selectedEventsTypes[tabIndex], ...types].filter(onlyUnique);
    } else {
      this.selectedEventsTypes[tabIndex] = this.selectedEventsTypes[tabIndex].filter(item => types.indexOf(item) < 0);
    }
  }
  onTypeChecked(e, type, tabIndex) {
    const includes = this.selectedEventsTypes[tabIndex].includes(type);
    const checked = e.target.checked;
    if (!checked && includes) {
      this.selectedEventsTypes[tabIndex] = this.selectedEventsTypes[tabIndex].filter(next => next !== type);
    } else if (checked && !includes) {
      this.selectedEventsTypes[tabIndex].push(type);
    }
  }

  isTypesChecked(types, tabIndex) {
    return !!types && types.every(next => this.selectedEventsTypes[tabIndex].includes(next));
  }
  isTypeChecked(type, tabIndex) {
    return this.selectedEventsTypes[tabIndex].includes(type);
  }

  onChangePage(e, index) {
    this.currentPageNums[index] = e;
  }

  getItems(index) {
    let start = (this.currentPageNums[index] - 1) * 10;
    return this.searchResults[index].slice(start, start + 10);
  }

  onItemClicked(item, tabIndex) {
    this.tabs[tabIndex] = item.search;
    this.isEventsView[tabIndex] = true;
    this.itemsClicked[tabIndex] = item;
    this.eventResults[tabIndex] = [];
    this.eventResultsLoaded[tabIndex] = false;

    this.restService.get500Events(item, this.selectedEventsTypes[tabIndex])
      .subscribe(
        results => {
          this.eventResults[tabIndex] = results;
          this.eventResultsLoaded[tabIndex] = true;
          this.currentEventsPageNums[tabIndex] = 1;
          this.eventsPageNums[tabIndex] = Math.ceil(this.eventResults[tabIndex].length / 5);
        }
      );
  }

  eventResults: Array<Event[]> = [];
  eventResultsLoaded: Array<boolean> = [false];
  currentEventsPageNums: Array<number> = [1];
  eventsPageNums: Array<number> = [0];

  onChangeEventsPage(e, index) {
    this.currentEventsPageNums[index] = e;
  }

  getEvents(index) {
    let start = (this.currentEventsPageNums[index] - 1) * 10;
    return this.eventResults[index].slice(start, start + 10);
  }

  doReloadEvents() {
    let tabsAmount = this.tabs.length;
    for (let i = 0; i < tabsAmount; i++) {
      if (this.isEventsView[i]) {
        this.onItemClicked(this.itemsClicked[i], i);
      }
    }
  }

}
