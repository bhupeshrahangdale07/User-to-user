public class User2UserSetup {
    @AuraEnabled(cacheable=true)
    public static U2U_Setting__mdt getCustomMetadata() {
    List<U2U_Setting__mdt> customMetadataList = [SELECT Id, MasterLabel, DeveloperName, kt_u2u__Allow_to_create_success_logs__c,kt_u2u__Allow_to_create_failed_records__c,kt_u2u__Batch_Size__c FROM kt_u2u__U2U_Setting__mdt WHERE DeveloperName = 'User2User' WITH SECURITY_ENFORCED LIMIT 1];
    
        system.debug('MetaData List # '+customMetadataList);
    if (!customMetadataList.isEmpty()) {
        return customMetadataList[0];
    }
    
    return null;
    }  
    
    @AuraEnabled(cacheable=true) 
    public static void updateCustomMetadata(Boolean successLog, Integer batchSize,Boolean failedLog){
        
       Boolean isMetadataUpdateNeeded = false;
        
       
        List<U2U_Setting__mdt> customMetadataList = [Select Id,MasterLabel,DeveloperName,kt_u2u__Allow_to_create_success_logs__c,kt_u2u__Allow_to_create_failed_records__c,kt_u2u__Batch_Size__c from kt_u2u__U2U_Setting__mdt where DeveloperName='User2User' WITH SECURITY_ENFORCED];
       system.debug('CMD List '+customMetadataList);  
        
        
        Metadata.DeployContainer mdContainer = new Metadata.DeployContainer();
        
        if(!customMetadataList.isEmpty()){
            Metadata.CustomMetadata metadataRec =  new Metadata.CustomMetadata();
            metadataRec.fullName = 'U2U_Setting__mdt.'+customMetadataList[0].DeveloperName;
            metadataRec.label = customMetadataList[0].MasterLabel; 
            
            Metadata.CustomMetadataValue updateFieldValue1 = new Metadata.CustomMetadataValue();
            updateFieldValue1.field = 'Allow_to_create_success_logs__c';
            updateFieldValue1.value = successLog;
            metadataRec.values.add(updateFieldValue1);
            
            
            Metadata.CustomMetadataValue updateFieldValue2 = new Metadata.CustomMetadataValue();
            updateFieldValue2.field = 'Batch_Size__c';
            updateFieldValue2.value = batchSize;
            metadataRec.values.add(updateFieldValue2);
            
            Metadata.CustomMetadataValue updateFieldValue3 = new Metadata.CustomMetadataValue();
            updateFieldValue3.field = 'Allow_to_create_failed_records__c';
            updateFieldValue3.value = failedLog;
            metadataRec.values.add(updateFieldValue3);
            
            mdContainer.addMetadata(metadataRec);
            isMetadataUpdateNeeded = true;
            
            }
       
        if(isMetadataUpdateNeeded)
        {
           if (!Test.isRunningTest()) {
            Metadata.Operations.enqueueDeployment(mdContainer, null);
        }  
        }
    }
}