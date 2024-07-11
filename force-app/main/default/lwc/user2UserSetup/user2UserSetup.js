import { LightningElement,wire} from 'lwc';
import getCustomMetadata from '@salesforce/apex/User2UserSetup.getCustomMetadata';
import updateCustomMetadata from '@salesforce/apex/User2UserSetup.updateCustomMetadata';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class User2UserSetup extends LightningElement {
    allowToCreateSuccessLogs = false;
    allowToCreateFailedLogs = false;
    batchSize = 0;

    @wire(getCustomMetadata)
    wiredCustomMetadata({ error, data }) {
        if (data) {
            this.allowToCreateSuccessLogs = data.kt_u2u__Allow_to_create_success_logs__c;
           
            this.allowToCreateFailedLogs = data.kt_u2u__Allow_to_create_failed_records__c;
            
            this.batchSize = data.kt_u2u__Batch_Size__c;
           
        } else if (error) {
            console.error('Error loading custom metadata', error);
        }
    }

    handleSuccessLogChange(event) {
        this.allowToCreateSuccessLogs = event.target.checked;
        console.log('check html ',this.allowToCreateSuccessLogs );
    }
    handleFailedLogChange(event) {
        this.allowToCreateFailedLogs = event.target.checked;
        console.log('check html failed ',this.allowToCreateFailedLogs );
    }

    handleBatchSizeChange(event) {
        const inputValue = event.target.value;
       /* if (inputValue.includes('.')) {
            // Decimal value detected
            this.showToast('Error', 'Batch Size cannot be a decimal number', 'error');
        } */
        this.batchSize = Number(inputValue, 10);
        console.log('integer html ', this.batchSize);

       
    }

    saveCustomMetadata() {
        console.log('checkbox ',this.allowToCreateSuccessLogs);
        console.log('Failedcheckbox ',this.allowToCreateFailedLogs);
        console.log('integer batch ',this.batchSize);
        if (this.batchSize <= 0 || this.batchSize > 2000 || this.batchSize===undefined || isNaN(this.batchSize)) {
            if (this.batchSize <= 0) {
                this.showToast('Error', 'Batch Size cannot be negative,zero,alphabet,special character', 'error');
            } else {
                this.showToast('Error', 'Batch Size should be in between 1 to 2000', 'error');
            }
        }
        else{
        updateCustomMetadata({ successLog: this.allowToCreateSuccessLogs, batchSize: this.batchSize, failedLog: this.allowToCreateFailedLogs })
            .then(result => {
               
               // this.showSuccess();
               this.showToast('Success', 'Record Updated Successfully', 'success');
               
                console.log('Custom metadata updated successfully',result);
            })
            .catch(error => {
                this.showToast('Error', 'Batch Size cannot be a decimal number', 'error');
               // this.showError();
               //this.showToast('Error', 'Error occurred', 'error');
                console.error('Error updating custom metadata', error);
            });
    }
        }

    showSuccess(){
        const evt = new ShowToastEvent({
            title: 'Success',
            message: 'Record Updated Successfully',
            variant: 'success',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }

    showError() {
        const evt = new ShowToastEvent({
            title: 'Error',
            message: 'Error occurred',
            variant: 'error',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }
    
}