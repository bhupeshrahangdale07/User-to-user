/* eslint-disable @lwc/lwc/no-async-operation */
/* eslint-disable no-console */
/* eslint-disable no-debugger */
/* eslint-disable vars-on-top */
/* eslint-disable @lwc/lwc/no-inner-html */
/* eslint-disable no-alert */
import { LightningElement, track, api, wire} from 'lwc';
import findRecords from '@salesforce/apex/CustomLookupController.findRecords';
import getcountuserrecords from '@salesforce/apex/CustomLookupController.countUserRecords';
import transferusertouser from '@salesforce/apex/CustomLookupController.usertousermigration';
import batchprogressbar from '@salesforce/apex/CustomLookupController.checkBatchStatus';
import getAllObj from '@salesforce/apex/CustomLookupController.getAllObj';
import getSObjects from '@salesforce/apex/CustomLookupController.getSObjects';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class userToUserMigration extends LightningElement {
    @track records;
    @track error;
    @track selectedRecord;
    @track errorMsg = '';
    @track errorMsgForAllObj = '';
    @track batchProcessMSG = false;
    @track norecords = false;
    @track masterUserID = '';
    @api uname = '';
    @api textboxdisable = false;
    @api rid = '';
    selectedSObject = [];
    sObjectOptions = [];
    @track body = '';
    @api index;
    @api relationshipfield;
    @api iconname = "standard:user";
    @api objectName = 'User';
    @api searchfield = 'Name';
    @track searchedRecords = [];
    @track cssDisplay = '';
    @track progressBar = '';
    @track transferData = [];
    @track batchid = '';
    isSetupObjectExist= false;
    isNonSetupObjectExist=false;
    @track showTransfer=false;
    @track txttype = 'search';
    @api searchRec = '';
    @track chkdisable = false;
    @track chkCheck = false;
    @track firstObj = '';
    @track tablelookuprecords = '';
    @track showbox = false;

    @track isSearchDisabled = false;
    @track isTransferDisabled = false;
    first = false;  
    showdata = false;
    
    @track showsearchedrecaccordion = false;
    @track showbatchstatusaccordion = false;
    @track currentactiveaccordion = ['search'];
    activeSectionsMessage = '';
    searchSpinner = false;

    searchButtonFlag = false;
    transferButtonFlag = true;

    executedPercentage;
    executedBatch;
    totalBatch;
    
    batchProgress = 0;
    batchHandle;

    @wire(getSObjects)
    wiredOptions({ error, data }) {
        
        this.searchSpinner = true;
        if (data) {
            this.sObjectOptions =[
                { label: '--None--', value: 'None' },
                { label: 'All', value: 'All' },
                ...data.map(item => ({
                    label: item.label + ' ( '+ item.apiName +' )' ,
                    value: item.apiName
                })),
            ];
            this.searchSpinner = false;
        } else if (error) {
            console.error('Error loading SObjects:', error);
        }
    }

    connectedCallback() {
      
    }

    disconnectedCallback() {
       
    }

    toggleSectionHandleW3web(event) {
        const openSections = event.detail.openSections;
        
        if (openSections.length === 0) {
            this.activeSectionsMessage = 'All sections are closed';
        } else {
            this.activeSectionsMessage =
                'Open sections: ' + openSections.join(', ');
        }
    }

    handleOnchange(event){
        event.preventDefault();
        const searchKey = event.detail.value;
        
       
        findRecords({
            searchKey : searchKey, 
            objectName : this.objectName, 
            searchField : this.searchfield
        })
        .then(result => {
            this.records = result;
            this.error = undefined;
        })
        .catch(error => {
            this.error = error;
            this.records = undefined;
        });
    }

    handleRemove(event){
        event.preventDefault();
        this.selectedRecord = undefined;
        this.records = undefined;
        this.error = undefined;
        
        const selectedRecordEvent = new CustomEvent(
            "selectedrec",
            {
                detail : { recordId : undefined, index : this.index, relationshipfield : this.relationshipfield}
            }
        );
        this.dispatchEvent(selectedRecordEvent);
    }
   
   
    handleMultiSelectSearch(){
        console.log('handleMultiSelectSearch-->');
        debugger;
        this.searchButtonFlag=true;
        this.batchProcessMSG=false;
        this.transferButtonFlag = true;
        this.showbatchstatusaccordion = false;
        /*console.log('this.chkCheck-->',this.chkCheck);
        this.chkCheck = false;
        console.log('this.chkCheck-->',this.chkCheck);*/
        //this.template.querySelector('.globalchk').checked=false;
        this.selectedRecord = undefined; 
        this.records = undefined;
                this.error = undefined;
                this.searchRec = '';
                this.chkdisable = false;
                this.masterUserID = '';
                this.masterId = '';
                this.errorMsgForAllObj = '';
                this.useronchk = '';
                this.textboxdisable = false;
                //this.checkboxChange('');
                this.txttype = 'search';
                
            
        const accordion = this.template.querySelector('.example-accordion');
        
        console.log('Selected Object@ ',JSON.stringify(this.selectedSObject));
        
        if((this.rid === '' || this.rid === undefined) && (this.selectedSObject.length === 0 || this.selectedSObject.includes('None'))){
            this.showToast('Error', 'Please Select User and Object ', 'error');
            this.searchButtonFlag=false;
        }
        else if((this.rid !== '' || this.rid !== undefined) && (this.selectedSObject.length === 0 || this.selectedSObject.includes('None'))){
            
            this.showToast('Error', 'Please Select Object ', 'error');
            this.searchButtonFlag=false;
        }
        else if((this.rid=== '' || this.rid === undefined) && this.selectedSObject.length !== 0 ){
            this.showToast('Error', 'Please Select User ', 'error');
            this.searchButtonFlag=false;
        }
        else{
           
            this.cssDisplay = true;
            let s = JSON.parse(JSON.stringify([]));
            this.searchedRecords = s;
            let data = [];
            accordion.activeSectionName = 'records';
            if(this.rid !== '' && this.selectedSObject.includes('All')){
                this.selectedSObject = '';
                this.handleSearch();
            }
            else if (this.rid !== '' && this.selectedSObject !== 'All' && this.selectedSObject.length !== 0){
                this.firstObj = true;
                const objectNames = Object.values(this.selectedSObject); 
                const batchSize = 50;
                const batches = [];
                let promises = [];
                for (let i = 0; i < objectNames.length; i += batchSize) {
                    const batch = objectNames.slice(i, i + batchSize);
                    batches.push(batch);
                }
                
                for (let i = 0; i < batches.length; i++) {
                    if (i === batches.length - 1) {
                        
                        promises.push(this.countUserRec(batches[i],true,false));
                    } else {
                       
                        promises.push(this.countUserRec(batches[i],false,false)); 
                    }
                }
                Promise.all(promises).then(result => {
                    if(result.length > 0)
                    {     
                        result[0].forEach(r => {
                            if(!r.isSetupObject){
                                if(!this.first) 
                                {
                                    r.firstObject = true;
                                    this.first = true;
                                    this.firstObj = r.objAPIName;
                                }
                                data.push(r);
                            }
                        })
                        
                        result[0].forEach(r => { 
                            if(r.isSetupObject){
                            data.push(r);
                            }
                        }) 
                       for(let i=0;i<data.length;i++){
                        if(i===0){
                            data[0].firstObject=true;
                            this.first=true;
                            this.firstObj = data[0].objAPIName;
                        }
                       }
                        
                        this.searchedRecords = data; 
                        this.assigntoallobjects();
                        this.openDefaultSelectedObj(this.firstObj);
                        if(this.isNonSetupObjectExist)
                        {
                            this.showTransfer = true;
                        }
                        if(this.searchedRecords.length === 0){
                            this.norecords = true;
                            this.showdata = false;
                            this.showTransfer = false;
                        } else {
                            this.showdata = true;
                            this.norecords = false;
                        }
                        this.cssDisplay = false;   
                    }
                });
            } else {
                this.cssDisplay = false;
                this.showdata = false;
                this.template.querySelector('c-record-data-table').changeRecord(undefined);
            }
        }
    }

    showToast(title, message, variant) {
        const toastEvent = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(toastEvent);
    }

    handleSearch(){
        if(!this.rid) {
            this.errorMsg = 'Please enter user name to search.';
            return;
          }
          this.cssDisplay = true;
   
        getAllObj()
        .then(result => {
        if(result){
          
            const objectNames = Object.values(result); 
            const batchSize = 100;
            const batches = [];
            let promises = [];
            

            for (let i = 0; i < objectNames.length; i += batchSize) {
                const batch = objectNames.slice(i, i + batchSize);
                batches.push(batch);
            }
            
            for(let i=0; i < batches.length; i++){
                if(i === batches.length-1){
                    promises.push(this.countUserRec(batches[i],true,false)); 
                }
                else{
                    promises.push(this.countUserRec(batches[i],false,false)); 
                }
            }
            
            
            Promise.all(promises).then(res => {
                let data = [];
                
                if(res.length > 0)
                {         
                   
                    res.forEach(r => {
                        
                        if(r.length > 0){
                            if(!r[0].isSetupObject){
                                if(!this.first) 
                                {
                                    r[0].firstObject = true;
                                    this.first = true;
                                    this.firstObj = r[0].objAPIName;
                                }
                                data.push(r[0]);
                               
                            }
                        }
                    })
                    res.forEach(r => { 
                        if(r.length > 0){
                            if(r[0].isSetupObject){
                                data.push(r[0]);
                            
                            }
                        }
                    }) 

                    for(let i=0;i<data.length;i++){
                        if(i===0){
                            data[0].firstObject=true;
                            this.first=true;
                            this.firstObj = data[0].objAPIName;
                        }
                       }
                      

                    this.searchedRecords = data;
                    this.assigntoallobjects();
                    this.openDefaultSelectedObj(this.firstObj);

                    if(this.isNonSetupObjectExist)
                    {
                        this.showTransfer = true;
                    }
                       
                    if(this.searchedRecords.length === 0){
                        this.norecords = true;
                        this.showdata = false;
                    } else {
                        this.showdata = true;
                        this.norecords = false;
                    }
                    this.cssDisplay = false; 
                }
                
                
            });
           
        }
        })
        .catch(error => {
           
            console.error('Error calling Apex method:', error);
        });  
    
    }

    countUserRec(bat){
    
    return new Promise((resolve, reject) => {
        getcountuserrecords({userId : this.rid ,objList : bat})
        .then(result => {
            resolve(result);
           
            })
            .catch(error => {
                console.log(JSON.stringify(error));
                reject(error);
            });
        });
    }

      
      handleSel(event)
      { 
       
        this.rid = event.detail.recordId;
        
        
        
      }

      selectAllObjects()
      {
        this.handleSearch();
      }

      handleSObjectChange(event) {
        const selectedOptions = event.detail;
      
        if (selectedOptions.length > 0) {
            this.selectedSObject = selectedOptions.map(option => option.value);
            
        }
        else {
            // If all options are deselected, set the selectedSObject array to an empty array
            this.selectedSObject = [];
        }
      
    }

      handleChangedValue(event)
      {
          var changedVal = event.detail;
          
          this.searchedRecords.forEach(rec => {
            if(rec.objAPIName === changedVal.objAPIName)
            {
                changedVal.objFields.forEach(f => {
                    if(f.userId === '' && this.masterUserID !== ''){
                        f.userId = this.masterUserID;
                    } 
                })
                rec.records = changedVal.records;
                rec.objFields = changedVal.objFields;
                rec.count = changedVal.count;
                rec.isObjectSelected = changedVal.isObjectSelected;
            }
          });

      }

      assigntoallobjects()
      {
        this.isSetupObjectExist = false;
        this.isNonSetupObjectExist = false;
        let allRecords = [...this.searchedRecords];
        let isSetupExist = this.isSetupObjectExist;
        let isNonSetup = this.isNonSetupObjectExist;
        
        allRecords.forEach((rec) => {
            
            rec.objFields.forEach((field) => {
                
                if(field.count > 0)
                {
                    field.hasRecords = true;
                    if(rec.isSetupObject && !isSetupExist)
                    {
                        isSetupExist = true;
                    }
                    if(!rec.isSetupObject && !isNonSetup){
                        isNonSetup = true;
                    }
                } 
            });
        });     
        this.searchedRecords = [...allRecords];
        this.isSetupObjectExist = isSetupExist;
        this.isNonSetupObjectExist = isNonSetup;
        
      }
      
      handleTransfer()
      {

        let userSelected = false;
        this.searchedRecords.forEach(record => {
            if (record.isGlobalSelected || record.objFields.some(field => field.userId)) {
                userSelected = true;
            }
        });
    
        if (!userSelected) {
            this.showToast('Error', 'Please select the User either at Object Level or Field Level before transferring.', 'error');
            this.transferButtonFlag = true; // Enable the transfer button again
            return;
        }

        this.transferButtonFlag =false;
        this.showsearchedrecaccordion = true;
        this.showbatchstatusaccordion = true;
        

        const accordion = this.template.querySelector('.example-accordion');
        accordion.activeSectionName = 'status';
        
        
        transferusertouser({  LSTusertousermigrat : JSON.stringify(this.searchedRecords), oldUserId : this.rid })
        .then(result => {             
            if(result !== '')
            {
                this.cssDisplay = false;
                this.batchid = result;
                this.batchProcessMSG = true;
                this.isSearchDisabled = true;
                this.isTransferDisabled = true;
                this.batchpercentage();
            }
            else {
                this.cssDisplay = false;
                this.batchProcessMSG = false;
                this.handleSearch();  
            }

            
        })
        .catch(error => {
            console.log(JSON.stringify(error));
        })
                  
       
        this.transferData.forEach(obj => {
            obj.oldUserId = this.rid;
           obj.records.forEach(o => {
                o.attributes = {};
                o.attributes.type = obj.objAPIName;
            })
        })
        
        
    }

      batchpercentage()
      {
        batchprogressbar()
        .then(result => {
           
            if(result){
                if(result.batchStatus === 'Queued'){
                    this.batchHandle=true;
                    //this.showToast('Success', 'The Batch is being Queued ', 'Success');
                    
                }
                else if(result.batchStatus === 'Processing'){
                    this.batchHandle=false;
                    
                }
                this.totalBatch = result.totalJobItems;
                console.log('this.totalBatch ->>' ,this.totalBatch);
                this.executedBatch = result.jobItemsProcessed;
                console.log('this.executedBatch ->>' ,this.executedBatch);
                this.batchProgress = result.batchProgress;
                console.log('this.batchProgress ->>' ,this.batchProgress);
               
                this.batchrecursion();
            } else {
                this.batchProgress = 100;
                this.executedBatch = this.totalBatch;
                //toast message-batch completed successfully add timeout for 3 sec
                //reload-window.reload
                this.showToast('Success', 'Batches Executed Successfully, Please check the Success and Failed Logs.', 'Success', 4000);
            setTimeout(() => {
                window.location.reload(); 
            }, 4000);
                
            }
        })
        .catch(error => {
            console.log(JSON.stringify(error));
        })
      }

      batchrecursion()
      {
        
          if(this.batchHandle || this.batchProgress !== 0 && this.batchProgress !== 100)
          {
            setTimeout(() => {
                this.batchpercentage();
            }, 8000); // Poll every 1 second
        
          }
      }

      openProgressBar()
      {
          this.progressBar = true;
      }

      closeModel()
      {
        this.progressBar = false;
      }

      handleformasteruser(event)
    {
        this.masterUserID = event.detail.recordId;
        this.uname = event.detail.username;
        //this.chkCheck=false;
        //this.errorMsgForAllObj = '';
        /*this.chkdisable = true;
        this.checkboxtrue = true;  
        this.masterId = this.masterUserID; 
        this.useronchk = this.uname;
        this.textboxdisable = true;
        this.tablelookuprecords = [];
        this.checkboxChange(this.masterUserID,true,this.uname);
        this.txttype = 'text';*/

        this.chkdisable = true;
                //this.chkCheck = true;
                this.checkboxtrue = true;  
                this.masterId = this.masterUserID; 
                this.useronchk = this.uname;
                this.textboxdisable = true;
                this.tablelookuprecords = [];
                this.checkboxChange(this.masterUserID,true,this.uname);
                this.txttype = 'text';
    }

      changeLookup(event)
    {
        this.showbox = false;
        
        console.log(event.target.checked);

        console.log('this.chkCheck-->',this.chkCheck);
        
        this.chkCheck = event.target.checked;

        console.log('this.chkCheck-->',this.chkCheck);
        
        if(this.masterUserID === '')
        {
            this.errorMsgForAllObj = "Please Select User";
            
            if(!event.target.checked)
            {
                this.errorMsgForAllObj = '';
                
            }
        }
        
        else{
            if(event.target.checked)
            {
                this.chkdisable = true;
                //this.chkCheck = true;
                this.checkboxtrue = true;  
                this.masterId = this.masterUserID; 
                this.useronchk = this.uname;
                this.textboxdisable = true;
                this.tablelookuprecords = [];
                this.checkboxChange(this.masterUserID,true,this.uname);
                this.txttype = 'text';
            }
            else{
                //this.rid = ''; 
                //this.selectedRecord = undefined; 
                //this.records = undefined;
                        //this.error = undefined;
                        //this.searchRec = '';
                this.chkdisable = false;
                this.chkCheck = false;
                this.checkboxtrue = false;
                this.masterId = '';
                //this.masterUserID = '';
                this.useronchk = '';
                this.errorMsgForAllObj = '';
                this.textboxdisable = false;
                this.tablelookuprecords = [];
                this.checkboxChange('',false,'');
                this.txttype = 'search';
            }
            this.selectedglobalrecord = "";
        }
    }

    checkboxChange(userId,chkVal,username)
    {
        this.searchedRecords.forEach(res => {
            res.objFields.forEach((field) => {
                field.userId = userId;
                field.userName = username;
                field.selectedRecord = "";
            }) 
            res.isGlobalSelected = chkVal;
        });

        this.transferData = this.searchedRecords;

        this.openDefaultSelectedObj(this.firstObj);
        this.callChild();
    }

    openSelectedObj(event)
    {
        var selecteddiv = event.target;
        let ulclose = selecteddiv.closest('ul').querySelectorAll('li');

        ulclose.forEach(c => {
            c.classList.remove('slds-is-active');
        })

        this.searchRec = '';
        this.firstObj = event.target.title;
        var recFound = false;
        this.searchedRecords.forEach(r => {
            if(this.transferData !== [])
            {
                this.transferData.forEach(transfer => {
                    if(transfer.objAPIName === event.target.title){
                        console.log('^^^ ' + JSON.stringify(transfer));
                        this.searchRec = [].concat(transfer);
                        recFound = true;
                    }
                })
            }
            if(!recFound){
                if(r.objAPIName === event.target.title) {
                    this.searchRec = [].concat(r);
                }
            }
        })
        selecteddiv.closest('li').classList.add('slds-is-active');
    }

    openDefaultSelectedObj(objectName) {
        
        this.searchedRecords.forEach(r => {
            if(r.objAPIName === objectName) {
                r.objFields.forEach(f => {
                    f.selectedRecord = '';
                })
                this.searchRec = [].concat(r);
            }
        })
    }

    callChild()
    {
        this.template.querySelector("c-record-data-table").rerenderCMP(this.searchRec[0]);
    }

    handleCancelSearchedUser(event){
        this.rid = ''; // Resetting the selected user ID
        this.searchButtonFlag = false;
       this.showdata=false;
       this.showTransfer=false;
        this.selectedRecord = undefined; 
        this.records = undefined;
                this.error = undefined;
                this.searchRec = '';
                this.chkdisable = false;
                this.chkCheck = false;
                this.masterId = '';
                this.errorMsgForAllObj = '';
                //this.useronchk = '';
                this.masterUserID = '';
                this.textboxdisable = false;
                //this.checkboxChange('');
                this.txttype = 'search';
        //this.rid = event.detail.recordId;
        //window.location.reload();
        
    }

    handleTxtCancle(){
        this.masterUserID = '';
        this.chkdisable = false;
        this.chkCheck = false;
        this.checkboxtrue = false;
        this.masterId = '';
        //this.masterUserID = '';
        this.useronchk = '';
        this.errorMsgForAllObj = '';
        this.textboxdisable = false;
        this.tablelookuprecords = [];
        this.checkboxChange('',false,'');
        this.txttype = 'search';



        var objectSlected = false;
        if(this.transferData !== ''){
            this.transferData.forEach(t => {
                if(t.isObjectSelected){
                    objectSlected = true;
                }
            })
        }
        if(!objectSlected && this.chkCheck) {
            this.chkdisable = false;
            this.checkboxtrue = false;
            this.masterId = '';
            this.errorMsgForAllObj = '';
            this.useronchk = '';
            this.masterUserID = '';
            this.textboxdisable = false;
            this.checkboxChange('');
            this.txttype = 'search';
            this.chkCheck = false;
        }
    }

}