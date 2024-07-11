/* eslint-disable @lwc/lwc/no-inner-html */
/* eslint-disable @lwc/lwc/no-document-query */
/* eslint-disable vars-on-top */
/* eslint-disable no-alert */
import { LightningElement, track, api, wire} from 'lwc';  
 import getLookupSerachRecords from '@salesforce/apex/CustomLookupController.getLookupSerachRecords';
 import getcountuserrecords from '@salesforce/apex/CustomLookupController.countUserRecords';  
 export default class CompositionContactSearch extends LightningElement {  
   // Tracked properties  
   @track records;  
   @track noRecordsFlag = false;  
   @track showoptions = true;  
   @track searchString = '';  
   @track selectedName = ''; 
   @track selectedId;  
   @track errorMsg;
   @track body = '';
   // API properties  
   @api selectedsobject;  
   @api recordlimit;  
   @api label;  
   // Wire method to function, which accepts the Search String, Dynamic SObject, Record Limit, Search Field  
   @wire(getLookupSerachRecords, { searchString: '$searchString' , selectedSObject : '$selectedsobject', recordLimit : '$recordlimit'})  
   wiredContacts({ error, data }) {  
     this.noRecordsFlag = 0;  
     if (data) {  
       this.records = data;  
       this.error = undefined;  
       this.noRecordsFlag = this.records.length === 0 ? true : false;  
     } else if (error) {  
       this.error = error;  
       this.records = undefined;  
     }  
   }

   // handle event called lookupselect  
   handlelookupselect(event){  
     this.selectedName = event.detail.Name;
     this.selectedId = event.detail.Id;
     this.showoptions = false;  
   }  
   // key change on the text field  
   handleKeyChange(event) {  
     this.showoptions = true;  
     this.searchString = event.target.value;  
   } 
   
   handleSearch(){
     var tbody = '';
     var tablesactionstart = '<article class="slds-card">   <div class="slds-card__header slds-grid">     <header class="slds-media slds-media_center slds-has-flexi-truncate">       <div class="slds-media__figure">         <span class="slds-icon_container slds-icon-standard-account" title="account">           <svg class="slds-icon slds-icon_small" aria-hidden="true">             <use xlink:href="/assets/icons/standard-sprite/svg/symbols.svg#account"></use>           </svg>           <span class="slds-assistive-text">account</span>         </span>       </div>       <div class="slds-media__body">         <h2 class="slds-card__header-title">           <a href="javascript:void(0);" class="slds-card__header-link slds-truncate">             <span>nameofobject</span>           </a>         </h2>       </div>           </header>   </div>   <div class="slds-card__body slds-card__body_inner">';
     var tablesactionend = '</div> </article>';
     var theader = '<table class="slds-table slds-table_cell-buffer slds-table_bordered slds-table_striped">   <thead>     <tr class="slds-line-height_reset">       <th class="" scope="col">         <div class="slds-truncate" title="Field Name">Field Name</div>       </th>       <th class="" scope="col">         <div class="slds-truncate" title="Record Count">Record Count</div>       </th>     </tr>   </thead>   <tbody>';

     if(!this.selectedId) {
      this.errorMsg = 'Please enter user name to search.';
      this.searchData = undefined;
      return;
    }

     getcountuserrecords({userId : this.selectedId})
        .then(result => {
            result.forEach((data) => {

              var allFields = data.objFields;
              var sactionOBJ = tablesactionstart;
              sactionOBJ = sactionOBJ.replace('nameofobject',data.objLabel);
              allFields.forEach((fields) => {

                tbody += '<tr class="slds-hint-parent">';
                 
                    tbody += '<td>';
                    tbody += '<div class="slds-truncate" title="'+fields.fieldLabel+'">'+fields.fieldLabel+'</div>';
                    tbody += '</td>'
                    tbody += '<td>';
                    tbody += '0';
                    tbody += '</td>'
                  
                tbody += '</tr>';
              
              });
              var tfooter = '</tbody></table>';
              
              this.body += sactionOBJ + theader + tbody + tfooter + tablesactionend;
              //alert(this.body);
              const container = this.template.querySelector('.container');
              container.innerHTML = this.body;
              tbody = '';
          });
        })
        .catch(error => {
            this.searchData = undefined;
            window.console.log('error =====> '+JSON.stringify(error));
            if(error) {
                this.errorMsg = error.body.message;
            }
        })
   }
 }