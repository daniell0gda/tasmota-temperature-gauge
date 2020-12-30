import {Component, Element, h, Listen} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';
import {Settings} from './settings';
import {AppThemeSetting} from '../app-settings/model';
import {ISettings} from '../../global/settings';

@Component({
  tag: 'my-app',
  styleUrl: 'my-app.scss',
  shadow: false
})
export class MyApp {

  appReady: boolean = false;

  @Element() el: HTMLStencilElement;

  async componentWillLoad(): Promise<void> {
    await Settings.updateSettings();
    this.checkIfToggleDarkTheme();
    Settings.changed$.subscribe((newSettings: ISettings) => {
      if (newSettings.appTheme === 'Dark') {
       this.toggleDarkTheme(true);
      }
      if (newSettings.appTheme === 'Light') {
        this.toggleDarkTheme(false);
      }
    });
  }

  /**
   * Handle service worker updates correctly.
   * This code will show a toast letting the
   * user of the PWA know that there is a
   * new version available. When they click the
   * reload button it then reloads the page
   * so that the new service worker can take over
   * and serve the fresh content
   */
  @Listen('swUpdate', {target: 'window'})
  async onSWUpdate(): Promise<void> {
    // const toast = await this.toastCtrl.create({
    //   message: 'New version available',
    //   showCloseButton: true,
    //   closeButtonText: 'Reload'
    // });
    // await toast.present();
    // await toast.onWillDismiss();
    window.location.reload();
  }

  render(): any[] {

    let app = <ion-nav/>;

    return (<ion-app>
        <ion-router useHash={false}>
          <ion-route url="/" component="app-home"/>
        </ion-router>

        {app}
      </ion-app>
    );
  }

  private checkIfToggleDarkTheme(): void {


    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');


    const shouldToggleDark = (prefersDark: boolean) => {
      if (prefersDark && Settings.appTheme === AppThemeSetting.SystemDefault) {
        return true;
      }
      return Settings.appTheme === AppThemeSetting.Dark;
    };

    this.toggleDarkTheme(shouldToggleDark(prefersDark.matches));

    // Listen for changes to the prefers-color-scheme media query
    prefersDark.addListener((mediaQuery: MediaQueryListEvent) => this.toggleDarkTheme(shouldToggleDark(mediaQuery.matches)));
  }

  private toggleDarkTheme(shouldAdd: boolean): void {
    document.body.classList.toggle('dark', shouldAdd);
  }
}

