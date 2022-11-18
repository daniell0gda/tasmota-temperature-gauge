import {Component, Element, h, Host, JSX, Prop} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';
import {Router} from 'stencil-router-v2';
import {AppStorage, Settings} from './my-app/settings';

@Component({
  tag: 'login-page'
})
export class LoginPage {

  @Element() el!: HTMLStencilElement;

  @Prop() history: Router;

  async componentWillLoad(): Promise<void> {

  }

  async componentDidLoad(): Promise<void> {

    try {
      await AppStorage.initFireBase();
    } catch (e) {
      alert('Initializing firebase failed!');
      throw new Error('Initializing firebase failed' + e);
    }

    await Settings.updateSettings();

    this.history.push('/app');
  }

  render(): JSX.Element {
    return <Host
      class={{
        'component-flex-container': true,
        'height-100': true
      }}
    >
    </Host>;
  }
}
