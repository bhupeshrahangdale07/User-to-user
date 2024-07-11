/* eslint-disable vars-on-top */
/* eslint-disable no-debugger */
/* eslint-disable no-alert */
/* eslint-disable @lwc/lwc/valid-api */
import { LightningElement, api } from 'lwc';

export default class SearchComponent extends LightningElement {
    
    @api searchkey = '';
    @api textboxdisabled;
    @api txttype = 'search';
    handleChange(event){
        /* eslint-disable no-console */
        //console.log('Search Event Started ');
        const searchkey = event.target.value;
        /* eslint-disable no-console */
        event.preventDefault();
        const searchEvent = new CustomEvent(
            'change', 
            { 
                detail : searchkey
            }
        );
        this.dispatchEvent(searchEvent);
    }

    hidesearchbox(){
        const blurbox = new CustomEvent(
            'blursearchbox', 
            { 
                
            }
        );
        this.dispatchEvent(blurbox);
    }
}