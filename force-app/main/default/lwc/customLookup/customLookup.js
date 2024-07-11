/* eslint-disable no-debugger */
/* eslint-disable no-else-return */
/* eslint-disable getter-return */
/* eslint-disable consistent-return */
/* eslint-disable @lwc/lwc/valid-api */
/* eslint-disable no-console */
/* eslint-disable vars-on-top */
/* eslint-disable @lwc/lwc/no-inner-html */
/* eslint-disable no-alert */
import { LightningElement, track, api } from 'lwc';
import searchRecords from '@salesforce/apex/CustomLookupController.findRecords';
//import getcountuserrecords from '@salesforce/apex/CustomLookupController.countUserRecords';
export default class CustomLookup extends LightningElement {
    @api records = [];
    @track error;
    @api selectedrecord = '';
    @api recid = '';
    @api objfieldapi = '';
    @track body = '';
    @api index;
    @api relationshipfield;
    @api iconname = "standard:user";
    @api objectname = 'User';
    @api searchfield = 'Name';
    @api textboxdisabled;
    @api searchkey = '';
    @api txttype = '';
    @api showbox = false;
    @api selecteduserforsearch;

    handleOnchange(event){
        event.preventDefault();

        var searchKey = event.detail.value;
        this.showbox = true;
       
        if(searchKey !== undefined) {
            if(searchKey.length !== 0){
                searchRecords({
                    searchKey : searchKey, 
                    objectName : this.objectname, 
                    searchField : this.searchfield,
                    selecteduserforsearch : this.selecteduserforsearch
                })
                .then(result => {
                    this.records = result;
                    this.template.querySelector('.slds-dropdown-trigger_click').classList.add('slds-is-open');
                    this.error = undefined;
                })
                .catch(error => {
                    this.error = error;
                    this.records = undefined;
                });
            } else {
                this.records = '';
            }
        } else {
            this.records = '';
        }
        
    }

    get isTextBox() {
        return this.txttype === 'text';
    }

    get isRecords() {
        console.log('### :: ' + JSON.stringify(this.records));
        return this.records !== undefined && this.records.length > 0;
    }

    handleSelect(event){
        
        const selectedRecordId = event.detail.recordId;
        var username = event.detail.username;
        var selectedRecordEvent = '';
        /* eslint-disable no-console*/
        this.selectedrecord = this.records.find( record => record.Id === selectedRecordId);
        /* fire the event with the value of RecordId for the Selected RecordId */
        /*const selectedRecordEvent = new CustomEvent(
            "selectedrec",
            {
                //detail : selectedRecordId
                detail : { recordId : selectedRecordId, index : this.index, relationshipfield : this.relationshipfield}
            }
        );*/
        if(this.objfieldapi !== '')
        {
            selectedRecordEvent = new CustomEvent(
                "selectedrec",
                {
                    //detail : selectedRecordId
                    detail : { recordId : selectedRecordId, selFieldAPI : this.objfieldapi, username : username }
                }
            );
        }
        else
        {
            selectedRecordEvent = new CustomEvent(
                "selectedrec",
                {
                    //detail : selectedRecordId
                    detail : { recordId : selectedRecordId, username : username }
                }
            );
        }
        
        this.recid = selectedRecordId;
        console.log('rec id', this.recid);
        this.dispatchEvent(selectedRecordEvent);
    }

    handleRemove(event){
        event.preventDefault();
       //this.recid= undefined;
        console.log(' remove rec id', this.recid);
        this.selectedrecord = undefined;
        this.records = undefined;
        this.error = undefined

        const selectedRecordEvent = new CustomEvent(
            "deselectedrec",
            {
                detail : { fieldAPI : this.objfieldapi}
            }
        );
        this.dispatchEvent(selectedRecordEvent);
    }

    handlehidesearchbox()
    {
        this.template.querySelector('.slds-dropdown-trigger_click').classList.remove('slds-is-open');
    }

    @api hidesearchbox(){
        this.showbox = false;
        this.selectedrecord = false;
        this.records = [];
        this.template.querySelector('.slds-dropdown-trigger_click').classList.remove('slds-is-open');
    }
}