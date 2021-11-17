import { Component, AfterViewInit, ViewChild, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Actions } from "@ngrx/effects";
import { Store } from '@ngrx/store';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ShortcutInput, ShortcutEventOutput, KeyboardShortcutsComponent, AllowIn } from "ng-keyboard-shortcuts";
import { plainToClass } from "class-transformer";

import { LoggedInAs, AuthState, getUser, LoggedOutAs } from '@app/core/store/auth';
import { getConfigCompany } from '@app/core/store/config';
import { User, LocalStorageService, Company } from '@app/core/services';
import { FocusSearchBox, ExitEditMode } from "@app/core/store/shortcuts";

@Component({
  selector: 'app-shortcuts',
  templateUrl: './shortcuts.component.html'
})
export class ShortcutsComponent implements OnInit, AfterViewInit {

  user: User;
  loggedInAs: User;
  theUser() {
    return !!this.loggedInAs ? this.loggedInAs : this.user;
  }

  company: Company;
  loginAsCompany: Company;
  theCompany() {
    return !!this.loginAsCompany ? this.loginAsCompany : this.company;
  }

  onLoggedInAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedInAs) {
      this.loggedInAs = this.lsService.getLoginAs();
      this.loginAsCompany = this.lsService.getCompany();
    }
  });
  onLoggedOutAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedOutAs) {
      this.loggedInAs = null;
      this.loginAsCompany = null;
    }
  });

  ngOnInit() {
    this.loggedInAs = this.lsService.getLoginAs();
    this.store.select(getUser).subscribe((user: any) => {
      this.user = plainToClass(User, user as User);
    });
    this.store.select(getConfigCompany).subscribe((company: Company) => {
      this.company = company;
    });
    this.loginAsCompany = this.lsService.getCompany();
  }

  /**
   * Shortcuts definition, will be init after view initialization.
   */
  shortcuts: ShortcutInput[] = [];
  @ViewChild(KeyboardShortcutsComponent) private keyboard: KeyboardShortcutsComponent;

  @ViewChild('helpTemplate') helpTemplate;
  modalRef: BsModalRef;

  openHelpModal() {
    this.modalRef = this.modalService.show(this.helpTemplate);
  }
  closeHelpModal() {
    this.modalRef && this.modalRef.hide()
  }

  constructor(
    private router: Router,
    private modalService: BsModalService,
    private actions$: Actions,
    private store: Store<AuthState>,
    private lsService: LocalStorageService) { }

  ngAfterViewInit(): void {
    this.shortcuts.push(
      {
        key: ["ctrl + alt + h", "ctrl + alt + ?"],
        description: "Opens help modal",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: e => {
          this.openHelpModal();
        }
      },

      {
        key: "ctrl + alt + q",
        description: "Exits edit mode",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          this.store.dispatch(new ExitEditMode());
        }
      },
      {
        key: "ctrl + alt + s",
        description: "Moves focus to the search box",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          this.store.dispatch(new FocusSearchBox());
        }
      },

      {
        key: "ctrl + alt + v",
        description: "Navigates to Vehicles / Navigates to Vehicles (Third Party)",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          if (this.theUser() && this.theUser().isUser()) {
            this.router.navigate(['/vehicles']);
          } else if (this.theUser() && this.theUser().isThirdParty()) {
            this.router.navigate(['/third-party/vehicles']);
          }
        }
      },
      {
        key: "ctrl + alt + n",
        description: "Navigates to Inspection Configuration",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          if (this.theUser() && this.theUser().isUser() && this.theCompany() && this.theCompany().devicesEnabled && !this.theCompany().cameraOnly) {
            this.router.navigate(['/inspection/configuration']);
          }
        }
      },
      {
        key: "ctrl + alt + d",
        description: "Navigates to Drivers",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          if (this.theUser() && this.theUser().isUser()) {
            this.router.navigate(['/drivers']);
          }
        }
      },
      {
        key: "ctrl + alt + m",
        description: "Navigates to Messages",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          if (this.theUser() && this.theUser().isUser() && this.theCompany() && this.theCompany().devicesEnabled && !this.theCompany().cameraOnly) {
            this.router.navigate(['/messages']);
          }
        }
      },
      {
        key: "ctrl + alt + a",
        description: "Navigates to Video Alerts",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          if (this.theUser() && this.theUser().isUser() && this.theCompany() && this.theCompany().devicesEnabled) {
            this.router.navigate(['/alerts']);
          }
        }
      },
      {
        key: "ctrl + alt + l",
        description: "Navigates to Locations Map",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          if (this.theUser() && this.theUser().isUser()) {
            this.router.navigate(['/location/locations']);
          } else if (this.theUser() && this.theUser().isAdmin()) {
            this.router.navigate(['/admin/location/locations']);
          }
        }
      },
      {
        key: "ctrl + alt + e",
        description: "Navigates to Devices",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          if (this.theUser() && this.theUser().isUser() && this.theCompany() && this.theCompany().devicesEnabled) {
            this.router.navigate(['/devices']);
          }
        }
      },
      {
        key: "ctrl + alt + u",
        description: "Navigates to Maintenance Issues / Navigate to Users (Admin)",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          if (this.theUser() && this.theUser().isUser() && this.theCompany() &&
            this.theCompany().enabledFeatures && this.theCompany().enabledFeatures.maintenance) {
            this.router.navigate(['/maintenance/issues']);
          } else if (this.theUser() && this.theUser().isAdmin()) {
            this.router.navigate(['/admin/users']);
          }
        }
      },
      {
        key: "ctrl + alt + f",
        description: "Navigates to Fuel",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          if (this.theUser() && this.theUser().isUser() && this.theCompany() &&
            this.theCompany().enabledFeatures && this.theCompany().enabledFeatures.fuel) {
            this.router.navigate(['/fuel']);
          }
        }
      },
      {
        key: "ctrl + alt + r",
        description: "Navigates to Reporting Profiles",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          if (this.theUser() && this.theUser().isUser()) {
            this.router.navigate(['/reporting']);
          }
        }
      },
      {
        key: "ctrl + alt + i",
        description: "Navigates to Dispatch",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          if (this.theUser() && this.theUser().isUser() && this.theCompany() &&
            this.theCompany().enabledFeatures && this.theCompany().enabledFeatures.dispatching) {
            this.router.navigate(['/dispatch']);
          }
        }
      },
      {
        key: "ctrl + alt + b",
        description: "Navigates to Bookings",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          if (this.theUser() && this.theUser().isUser() && this.theCompany() &&
            this.theCompany().enabledFeatures && this.theCompany().enabledFeatures.dispatching) {
            this.router.navigate(['/bookings']);
          }
        }
      },
      {
        key: "ctrl + alt + s",
        description: "Navigates to Customers",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          if (this.theUser() && this.theUser().isUser() && this.theCompany() &&
            this.theCompany().enabledFeatures && this.theCompany().enabledFeatures.dispatching) {
            this.router.navigate(['/customers']);
          }
        }
      },
      {
        key: "ctrl + alt + c",
        description: "Navigates to Company / Navigate to Companies (Admin) / Navigate to Companies (Third Party)",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          if (this.theUser() && this.theUser().isUser()) {
            this.router.navigate(['/company']);
          } else if (this.theUser() && this.theUser().isAdmin()) {
            this.router.navigate(['/admin/companies']);
          } else if (this.theUser() && this.theUser().isThirdParty()) {
            this.router.navigate(['/third-party/companies']);
          }
        }
      },
      {
        key: "ctrl + alt + y",
        description: "Navigates to System (Admin)",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          if (this.theUser() && this.theUser().isAdmin()) {
            this.router.navigate(['/admin/system']);
          }
        }
      },
      {
        key: "ctrl + alt + i",
        description: "Navigates to Invoices (Admin)",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          if (this.theUser() && this.theUser().isAdmin()) {
            this.router.navigate(['/admin/invoices']);
          }
        }
      },
      {
        key: "ctrl + alt + o",
        description: "Navigates to Hours of Service / Navigate to Connections (Admin)",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          if (this.theUser() && this.theUser().isUser() && this.theCompany() &&
            this.theCompany().enabledFeatures && this.theCompany().enabledFeatures.hoursOfService) {
            this.router.navigate(['/hours/drivers']);
          } else if (this.theUser() && this.theUser().isAdmin()) {
            this.router.navigate(['/admin/connections']);
          }
        }
      },
      {
        key: "ctrl + alt + d",
        description: "Navigates to Devices (Admin)",
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        command: (output: ShortcutEventOutput) => {
          if (this.theUser() && this.theUser().isAdmin()) {
            this.router.navigate(['/admin/devices']);
          }
        }
      }
    );

    // this.keyboard.select("ctrl + alt + q").subscribe(e => console.log(e));
  }

}
