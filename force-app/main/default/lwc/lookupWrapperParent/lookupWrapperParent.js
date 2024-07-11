import { LightningElement, track } from 'lwc';  
 export default class PaginationWrapperBase extends LightningElement {  
   @track selectedAccountRecord;  
   @track selectedContactRecord;  
   // Event bubbles to grandparent and being handled here - Account  
   handlelookupselectaccount(event) {  
     this.selectedAccountRecord = event.detail;  
   }  
   // Event bubbles to grandparent and being handled here - Contact  
   handlelookupselectcontact(event) {  
     this.selectedContactRecord = event.detail;  
   }  
 }