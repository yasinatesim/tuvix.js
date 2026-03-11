import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HomeApp } from './home.component';

@NgModule({
  declarations: [HomeApp],
  imports: [BrowserModule, CommonModule],
  bootstrap: [HomeApp]
})
export class HomeAppModule {}
