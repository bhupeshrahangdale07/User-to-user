public class UpdateRelatedFieldBatch implements Database.Stateful, Database.Batchable<SObject> {
    private String objectName;
    private String relatedFieldName;
    private String oldUserId;
    private String newUserId;
    private List<CustomLookupController.FieldWrapper> fieldWrapperLst;
    private Integer indexOf;
    public Integer recordsFailed = 0;
    public Integer recordsProcessed = 0;
    public String parentLogId;
    public List<U2U_Setting__mdt> u2umetasettings;
    public UpdateRelatedFieldBatch(String objectName, String relatedFieldName, String oldUserId, String newUserId, List<CustomLookupController.FieldWrapper> fieldWrapperLst, Integer indexOf,String parentLogId,List<U2U_Setting__mdt> u2umetasettings,Integer recordsFailed) {
        this.objectName = objectName;
        this.relatedFieldName = relatedFieldName;
        this.oldUserId = oldUserId;
        this.newUserId = newUserId;
        this.fieldWrapperLst = fieldWrapperLst;
        this.indexOf = indexOf;
        this.parentLogId = parentLogId;
        this.u2umetasettings = u2umetasettings;
        this.recordsFailed = recordsFailed;
         system.debug('fieldWrapperLst @ ' +fieldWrapperLst);
    }
   
    
    public Database.QueryLocator start(Database.BatchableContext context) {
        indexOf++;
        String query = 'SELECT Id, ' + relatedFieldName + ' FROM ' + objectName + ' WHERE ' + relatedFieldName + ' = :oldUserId WITH SECURITY_ENFORCED';
        return Database.getQueryLocator(query);
    }
    
    public void execute(Database.BatchableContext context, List<SObject> scope) {
        List<SObject> recordsToUpdate = new List<SObject>();
        for (SObject record : scope) {
            if (record != null) {
                try {
                    record.put(relatedFieldName, newUserId);
                    recordsToUpdate.add(record);
                    recordsProcessed++;
                }
                catch (Exception e) {
                    recordsFailed++;
                }
            }
        }
        
        if (!recordsToUpdate.isEmpty()) {
            Database.SaveResult[] srList = Database.update(recordsToUpdate, false);
            List<U2U_Detail_Log__c> u2uDetailLogList = new List<U2U_Detail_Log__c>();
            for (Database.SaveResult sr : srList) {
                if (!sr.isSuccess() && u2umetasettings[0].Allow_to_create_failed_records__c){
                    String recordIdWithErrMsg ='';
                    String recordId='';
                    for(Database.Error err :  sr.getErrors()) {
                        recordIdWithErrMsg += err.getMessage(); 
                        recordId  += sr.getId();
                    }
                    U2U_Detail_Log__c u2uDetailLog = new U2U_Detail_Log__c();
                    u2uDetailLog.U2U_Log__c = parentLogId;
                    u2uDetailLog.To_User__c = newUserId;
                    u2uDetailLog.Field_Name__c = relatedFieldName;
                    u2uDetailLog.Message__c = recordIdWithErrMsg;
                    u2uDetailLog.Record_ID__c= recordId;
                    u2uDetailLog.Result__c = 'Failed';
                    u2uDetailLogList.add(u2uDetailLog);
                    recordsFailed++;
                }
                else{
                    if(u2umetasettings[0].Allow_to_create_success_logs__c){
                        U2U_Detail_Log__c u2uDetailLog = new U2U_Detail_Log__c();
                        u2uDetailLog.U2U_Log__c = parentLogId;
                        u2uDetailLog.To_User__c = newUserId;
                        u2uDetailLog.Field_Name__c = relatedFieldName;
                        u2uDetailLog.Message__c = 'New User updated successfully';
                        u2uDetailLog.Result__c = 'Success';
                        u2uDetailLogList.add(u2uDetailLog);
                    }
                }
            }
            if(u2uDetailLogList.size() >0){
                insert u2uDetailLogList;
            }
        }
    }
    
    public void finish(Database.BatchableContext context) {
        if(fieldWrapperLst.size() > indexOf){
            UpdateRelatedFieldBatch batchInstance = new UpdateRelatedFieldBatch(fieldWrapperLst[indexOf].objAPIName ,fieldWrapperLst[indexOf].fieldAPI,oldUserId,fieldWrapperLst[indexOf].userId,fieldWrapperLst,indexOf,parentLogId,u2umetasettings,recordsFailed);
            Database.executeBatch(batchInstance);
        }
        else{
            U2U_Log__c u2uLog = new U2U_Log__c(Id=parentLogId);
            u2uLog.No_of_Records_Fail__c = recordsFailed;
            update u2uLog;
        }
        
    }
}