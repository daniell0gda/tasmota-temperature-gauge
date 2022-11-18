import {Component, Element, h, Listen} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';
import {createRouter, Route} from 'stencil-router-v2';

const Router = createRouter();

@Component({
  tag: 'my-app',
  styleUrl: 'my-app.scss',
  shadow: false
})
export class MyApp {

  appReady: boolean = false;

  @Element() el: HTMLStencilElement;

  async componentWillLoad(): Promise<void> {
    Router.push('/');
  }

  async componentDidLoad(): Promise<void> {

  }

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

    return (<ion-app>
        <Router.Switch>

          <Route path="/">
            <login-page history={Router}>

            </login-page>
          </Route>

          <Route path={/^\/app/}>
            <app-home>

            </app-home>
          </Route>

        </Router.Switch>
      </ion-app>
    );
  }
}

