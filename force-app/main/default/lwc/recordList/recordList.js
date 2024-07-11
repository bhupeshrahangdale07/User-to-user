/* eslint-disable no-debugger */
import { LightningElement, api } from 'lwc';

export default class RecordList extends LightningElement {
    @api record;
    @api fieldname;
    @api iconname;

    handleSelect(event){
        event.preventDefault();
        const selectedRecord = new CustomEvent(
            "select",
            {
                detail : { recordId : this.record.Id , username : this.record.Name }
            }
        );
        /* eslint-disable no-console */
        //console.log( this.record.Id);
        /* fire the event to be handled on the Parent Component */
        this.dispatchEvent(selectedRecord);
    }
}