import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ProfileApp } from './profile.component';

@NgModule({
  declarations: [ProfileApp],
  imports: [BrowserModule],
  bootstrap: [ProfileApp]
})
export class ProfileAppModule {}
