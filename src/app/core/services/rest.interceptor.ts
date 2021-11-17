import { TOKEN_INTERCEPTOR_HEADER } from '@app/core/smartadmin.config';
import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { EMPTY, Observable, throwError } from 'rxjs';

import { Store } from '@ngrx/store';

import * as fromAuth from '../store/auth';
import { catchError } from 'rxjs/operators';
import { LocalStorageService } from './rest.service';
import { environment } from "@env/environment";

@Injectable()
export class RestInterceptor implements HttpInterceptor {

    constructor(
        public store: Store<fromAuth.AuthState>,
        private lsService: LocalStorageService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let doIntercept: boolean = !!request.headers.get(TOKEN_INTERCEPTOR_HEADER);
        let doVisIntercept: boolean = !!request.url.includes(environment.visApiUrl); // adding the interceptor broke authentication for vistrack. so changed like this.
        if (doIntercept) {
            return this.handleApiRequest(request, next);
        } else if (doVisIntercept) {
            return this.handleVisApiRequest(request, next);
        } else {
            return next.handle(request);
        }
    }

    handleApiRequest(request: HttpRequest<any>, next: HttpHandler) {
        let apiKey = this.lsService.getApiKey();
        let headers = {
            "X-Auth-Token": apiKey
        }
        let loginAs = this.lsService.getLoginAs();

        if (loginAs && !request.headers.has('x-bypass-interceptor')) {
            headers["X-Auth-AsUser"] = loginAs.username;
        }

        request = apiKey
            ? request.clone({
                setHeaders: headers
            })
            : request;

        // delete 'x-bypass-interceptor' header
        request = request.clone({
            headers: request.headers.delete('x-bypass-interceptor')
        })
        const handler = next.handle(request).pipe(
            catchError((error, caught) => {
                if (error.status === 401) {
                    this.store.dispatch(new fromAuth.LogoutAction());
                }
                return throwError(error);
            })
        );

        return handler;
    }

    handleVisApiRequest(request: HttpRequest<any>, next: HttpHandler) {
        let loginAs = this.lsService.getLoginAs();
        let visApiKey = !!loginAs ? this.lsService.getLoginAsVisApiKey() : this.lsService.getVisApiKey();

        if (!!visApiKey) {
            const headers = {
                "Authorization": `Basic ${visApiKey}`,
            };
            request = request.clone({
                setHeaders: headers
            });
            return next.handle(request).pipe(
                catchError((error, caught) => {
                    if (error.status === 403) {
                        console.error(error)
                    }
                    return throwError(error);
                }));
        } else {
            console.error("Vistrack API token is not generated.");
            return EMPTY;
        }
    }

}
