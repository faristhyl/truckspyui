import { NgModule } from "@angular/core";
import { ToggleActiveDirective } from "./toggle-active.directive";
import { VarDirective } from "./ng-var.directive";
import { NgModelChangeDebouncedDirective } from "./ng-model-change-debounced.directive";

@NgModule({
  declarations: [ToggleActiveDirective, VarDirective, NgModelChangeDebouncedDirective],
  exports: [ToggleActiveDirective, VarDirective, NgModelChangeDebouncedDirective]
})
export class UtilsModule { }
