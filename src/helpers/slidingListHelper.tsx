import { h } from '@stencil/core';
import { HTMLStencilElement } from '@stencil/core/internal';


export class SlidingListHelper {
    slideItemOpenStateMap: { [itemName: string]: boolean } = {};

    addSlot: boolean = true;
    buttonSize: 'small' | 'default' | 'large' = 'default';

    constructor(private el: HTMLStencilElement) {

    }

    listItemSlideToggleButtonRender(slideItemId: string): any {
        return <ion-button class="ion-item-slider-toggle"
                           slot={ this.addSlot ? 'end' : '' }
                           size={ this.buttonSize }
                           onClick={ this.listItemEditClicked.bind(this, slideItemId) }>
            <ion-icon slot="icon-only" size="small"
                      name={ this.isSlideItemOpen(slideItemId) ? 'arrow-forward-circle' : 'create' }>
            </ion-icon>
        </ion-button>;
    }

    async closeSlidingItems(): Promise<void> {

        const id = Object.keys(this.slideItemOpenStateMap)[0];
        if (!id) {
            return;
        }
        const slidingItem = document.querySelector<HTMLIonItemSlidingElement>(`#${ id }`);
        await slidingItem.closeOpened();
        for (const key in this.slideItemOpenStateMap) {
            if (this.slideItemOpenStateMap.hasOwnProperty(key)) {
                this.slideItemOpenStateMap[key] = false;
            }
        }
        this.el.forceUpdate();
    }

    private isSlideItemOpen(id: string): boolean {
        const value = this.slideItemOpenStateMap[id];
        return value;

    }

    private async listItemEditClicked(listItemId: string, event: MouseEvent): Promise<void> {
        event.preventDefault();
        if (event.stopPropagation) {
            event.stopPropagation();
        }
        const slidingItem = document.querySelector<HTMLIonItemSlidingElement>(`#${ listItemId }`);
        const anythingOpened = await slidingItem.closeOpened();

        if (!anythingOpened) {
            document.querySelector<HTMLIonItemSlidingElement>(`#${ listItemId }`).open('end');
            this.slideItemOpenStateMap[listItemId] = true;
        } else {
            this.slideItemOpenStateMap[listItemId] = false;
        }
        this.el.forceUpdate();
    }
}
