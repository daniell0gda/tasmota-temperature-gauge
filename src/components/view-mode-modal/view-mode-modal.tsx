import { Component, Element, Prop, h, Host } from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';

@Component({
    tag: 'view-mode-modal',
})
export class ViewModeModal {

    @Element() el: HTMLStencilElement;
    @Prop() _value:string = '';

    render(): any {
        return <Host
                class={{
                    'component-flex-container': true,
                    'height-100': true
                }}
            >

            </Host>;
    }
}
