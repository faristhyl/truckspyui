import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { Store } from '@ngrx/store';
import { AuthService, LocalStorageService, RestService } from '@app/core/services'

import * as fromAuth from '@app/core/store/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../auth.component.css']
})
export class LoginComponent implements OnInit {
  readonly HOS_CONNECTION_NAME: string = 'Vistracks';

  email: string = "";
  password: string = "";

  // email: string = "admin";
  // password: string = "hVnHWPM6nqQ9khmD";

  // email: string = "f.holbrook@gmail.com";
  // password: string = "easypassword";

  // email: string = "flint@goliadequity.com";
  // password: string = "ezpassword";

  // email: string = "flint@example.com";
  // password: string = "something";
  errorMessage: string = null;

  constructor(
    private router: Router,
    private lsService: LocalStorageService,
    private restService: RestService,
    private authService: AuthService,
    private store: Store<fromAuth.AuthState>) { }

  ngOnInit() {}

  saveUserDataToStore(user) {
    this.store.dispatch(new fromAuth.AuthTokenPayload(user));
    this.store.dispatch(new fromAuth.AppInit(user.isAdmin() || user.isThirdParty()));
  }

  initAndRedirect(user, redirectUrl = null) {
    this.saveUserDataToStore(user);
    let home = redirectUrl || user.getEntryPoint();
    this.router.navigateByUrl(home);
  }

  login() {
    this.errorMessage = null;

    this.restService.doLogin(this.email, this.password)
      .subscribe(
        authInfo => {
          console.log("Logged in successfully");
          this.lsService.storeApiKey(authInfo.apiKey);

          let user = authInfo.user;
          const isAdmin = user.isAdmin();
          const isThirdParty = user.isThirdParty();
          if (isAdmin || isThirdParty) {
            this.initAndRedirect(user);
          } else {
            this.restService.get1000Connections()
              .subscribe(connections => {
                let visTracks = connections.find(
                  c => c.type.toLowerCase() === this.HOS_CONNECTION_NAME.toLowerCase() || c.name.toLowerCase() === this.HOS_CONNECTION_NAME.toLowerCase()
                );
                this.lsService.storeVisApiKey(visTracks ? visTracks.auth : null);

                const redirectUrl = this.authService.redirectUrl;
                this.initAndRedirect(user, redirectUrl);
              });
          }
        },
        error => {
          this.errorMessage = error;
        },
        () => console.log('the login api call is done!')
      );
  }

}
