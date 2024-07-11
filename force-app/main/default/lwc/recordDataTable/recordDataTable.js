/* eslint-disable no-alert */
/* eslint-disable @lwc/lwc/no-document-query */
/* eslint-disable no-debugger */
/* eslint-disable vars-on-top */
/* eslint-disable no-console */
import { LightningElement, api, track } from 'lwc';

export default class recordDataTable extends LightningElement {

    @api records = '';
    @api lookuprecords = "";
    @track objlabel;
    @track result = '';
    @api uid;
    @api rid;
    @api uname = '';
    @track masteruname = '';
    @api useronchk = '';
    @api issetupobj;
    @track masterUserID = '';
    @track masterId = '';
    @api checkboxtrue;
    @api allrecords = '';
    @track errorMsg = '';
    @api txttype = '';
    @api chkdisable = false;
    @track oldrecords = false;
    @api selectedRecord = '';
    @track globaltxttype = '';
    @api selectedglobalrecord = '';
    @api showbox;
    @api showboxfromtable;
    @api selectedrecid;
    

    connectedCallback() {
        this.records = JSON.parse(JSON.stringify(this.records));
        
        if(this.records.isObjectSelected && !this.records.isGlobalSelected) {
            this.checkboxtrue = true;
            this.records.objFields.forEach(r => {
                this.useronchk = r.userName;
                this.oldrecords = true;
                this.selectedglobalrecord = {"Id":r.userId,"Name":r.userName};
            })
            this.txttype = 'text';
        } else if(this.records.isGlobalSelected && !this.records.isObjectSelected){
            this.globaltxttype = 'text';
            this.records.objFields.forEach(r => {
                this.useronchk = r.userName;
                r.selectedRecord = "";
            })
        } else if(!this.records.isGlobalSelected && !this.records.isObjectSelected) {
            debugger;
            this.useronchk = '';
            this.checkboxtrue = false;
            this.globaltxttype = 'search';
            
            this.records.objFields.forEach(r => {
                if(r.userId !== ''){
                    this.oldrecords = true;
                    r.selectedRecord = { "Id":r.userId , "Name":r.userName};
                }
            })
        }
    }


    @api
    changeRecord(data){
        debugger;
        if(data !== undefined){
            this.records = data;
            if(this.records.isObjectSelected && !this.records.isGlobalSelected) {
                this.checkboxtrue = true;
                this.records.objFields.forEach(r => {
                    this.useronchk = r.userName;
                    this.oldrecords = true;
                    this.selectedglobalrecord = {"Id":r.userId,"Name":r.userName};
                })
                this.txttype = 'text';
            } else if(this.records.isGlobalSelected && !this.records.isObjectSelected){
                this.globaltxttype = 'text';
                this.records.objFields.forEach(r => {
                    this.useronchk = r.userName;
                    r.selectedRecord = "";
                })
            } else if(!this.records.isGlobalSelected && !this.records.isObjectSelected) {
                debugger;
                this.useronchk = '';
                this.checkboxtrue = false;
                this.globaltxttype = 'search';
                
                this.records.objFields.forEach(r => {
                    if(r.userId !== ''){
                        this.oldrecords = true;
                        r.selectedRecord = { "Id":r.userId , "Name":r.userName};
                    }
                })
            }
        } else {
            this.records = undefined;
        }
    }

    changeLookup(event)
    {
        if(this.masterUserID === '' && !this.oldrecords)
        {
            this.errorMsg = "Please Select User";

            if(!event.target.checked)
            {
                this.errorMsg = '';
            } 
        }
        else{
            if(event.target.checked)
            {
                this.checkboxtrue = true;
                this.useronchk = this.masteruname;
                this.txttype = 'text';
                this.lookuprecords = [];
                this.checkboxChange(event,this.masterUserID,true,this.masteruname);
            }
            else{
                this.checkboxtrue = false;
                this.errorMsg = '';
                this.useronchk = '';
                this.txttype = 'search';
                this.lookuprecords = [];
                this.checkboxChange(event,'',false,'');
            }
        }
    }

    checkboxChange(event,userId,chkVal,username)
    {
        this.allrecords = JSON.parse(JSON.stringify(this.records));
        var allFields = this.records.objFields;
        
        allFields.forEach((field) => {
            field.userId = userId;
            field.userName = username;
            field.selectedRecord = "";
        })
        console.log('&&& :: ' + JSON.stringify(allFields));
        this.allrecords.isObjectSelected = chkVal;
        this.allrecords.objFields = allFields;

        const returnValue = new CustomEvent("returnupdatedobject", {
            detail: this.allrecords
        });
        this.records.objFields = this.allrecords.objFields;
        // Dispatches the event.
        this.dispatchEvent(returnValue);
    }

    handleSel(event)
    {
        this.allrecords = JSON.parse(JSON.stringify(this.records));
        var allFields = this.records.objFields;
        this.rid = event.detail.recordId;
        console.log('Rid ',this.rid);
        this.uname = event.detail.username;
        
        allFields.forEach((field) => {
            if(field.fieldAPI === event.detail.selFieldAPI)
            {
                field.userId = this.rid;
                field.userName = this.uname;
                field.selectedRecord = {"Id":this.rid,"Name":this.uname};
            }
        })
        console.log('&&& :: ' + JSON.stringify(allFields));
        this.allrecords.isObjectSelected = this.checkboxtrue;
        this.allrecords.objFields = allFields;

        const returnValue = new CustomEvent("returnupdatedobject", {
            detail: this.allrecords
        });

        this.records = this.allrecords;
        this.records.objFields = this.allrecords.objFields;

        // Dispatches the event.
        this.dispatchEvent(returnValue);
    }

    hadleRemove(event)
    {
        this.allrecords = JSON.parse(JSON.stringify(this.records));
        var allFields = this.records.objFields;

        allFields.forEach((field) => {
            if(field.fieldAPI === event.detail.fieldAPI)
            {
                field.userId = "";
                field.userName = "";
                field.selectedRecord = "";
            }
        })
        
        this.allrecords.isObjectSelected = this.checkboxtrue;
        this.allrecords.objFields = allFields;

        const returnValue = new CustomEvent("returnupdatedobject", {
            detail: this.allrecords
        });

        this.records = this.allrecords;
        this.records.objFields = this.allrecords.objFields;

        // Dispatches the event.
        this.dispatchEvent(returnValue);
    }

    handleformasteruser(event)
    {
        this.masterUserID = event.detail.recordId;
        this.masteruname = event.detail.username;
        this.checkboxtrue = true;
        //this.errorMsg = '';

        //this.checkboxtrue = true;
        this.useronchk = this.masteruname;
        this.txttype = 'text';
        this.lookuprecords = [];
        this.checkboxChange(event,this.masterUserID,true,this.masteruname);
        
        //this.checkboxChange('');
        //console.log('this.checkboxtrue-> ',this.checkboxtrue);
        //this.checkboxChange(event,'',false,'');
                /*this.useronchk = this.masteruname;
                this.txttype = 'text';
                this.lookuprecords = [];
                this.checkboxChange(event,this.masterUserID,true,this.masteruname);*/
    }

    handleTxtCancle()
    {
        if(this.checkboxtrue)
        {
            if(this.records.isGlobalSelected && !this.records.isObjectSelected){
                this.records.objFields.forEach(r => {
                    this.useronchk = r.userName;
                })
                this.txttype = 'text';
            } else {
                this.chkdisable = false;
                this.checkboxtrue = false;
                this.masterId = '';
                this.errorMsgForAllObj = '';
                this.useronchk = '';
                this.masterUserID = '';
                this.textboxdisable = false;
                this.checkboxChange('');
                //this.checkboxChange(event,this.masterUserID,false,this.masteruname);
                this.txttype = 'search';
                this.chkCheck = false;
            }
        } else {
            this.masterUserID = '';
        }
    }

    @api rerenderCMP(record) {

        this.records = JSON.parse(JSON.stringify(record));
        this.showboxfromtable = false;
        this.template.querySelector("c-custom-Lookup").hidesearchbox();
    }
}