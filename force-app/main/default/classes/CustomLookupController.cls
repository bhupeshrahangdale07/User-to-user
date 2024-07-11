public with sharing class CustomLookupController {
    
    public static List<U2U_Setting__mdt> u2umetasettings = [Select Ignore_sObject__c,Setup_Objects__c,Allow_to_create_success_logs__c,kt_u2u__Batch_Size__c,Allow_to_create_failed_records__c From U2U_Setting__mdt WITH SECURITY_ENFORCED limit 1];
    
    @AuraEnabled(cacheable=true)  
    public static List<Account> getLookupSerachRecords(String searchString, String selectedSObject, Integer recordLimit) { 
        String searchStr = '%' + searchString + '%';
        if(searchStr != null && searchStr != ''){  
            String query = 'select Name, Id from ' + selectedSObject;  
            query += ' where Name like \''+ searchStr +'\'';  
            query+= ' limit ' + recordLimit;    
            return Database.query(query);  
        }  
        return null;  
    }
    
    @AuraEnabled(cacheable=true)
    public static List<SObject> findRecords(String searchKey, String objectName, String searchField,String selecteduserforsearch){
        String key = '%' + searchKey + '%';
        
        String query = 'Select Id, '+searchField;
        
        if(objectName == 'User')
        {
            query += ',IsActive';
        }
        
        query += ' From '+objectName +' Where '+searchField +' LIKE :key';
        
        if(String.isNotBlank(selecteduserforsearch)){
             query += ' and Id != :selecteduserforsearch';
        }
        
        
        System.debug(System.LoggingLevel.DEBUG, query);
        List<SObject> sObjectList = Database.query(String.escapeSingleQuotes(query));
        system.debug(sObjectList);
        return sObjectList;
    }
    
    
    @AuraEnabled
    public static List<String> getAllObj(){
        List<String> objList = new List<String>();
        
        for(String obj:Schema.getGlobalDescribe().keySet()){
            String objNames = String.valueOf(obj);
            objList.add(objNames);
        }
        return objList;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<SObjectInfo> getSObjects() {
        List<SObjectInfo> sObjectList = new List<SObjectInfo>();
        
        Map<String, Schema.SObjectType> gd = Schema.getGlobalDescribe();
        Set<String> ignorsObject = new Set<String>();
        if(String.isNotBlank(u2umetasettings[0].Ignore_sObject__c)){
            ignorsObject.addAll(u2umetasettings[0].Ignore_sObject__c.split(';'));
        }
        if(String.isNotBlank(u2umetasettings[0].Setup_Objects__c)){
            ignorsObject.addAll(u2umetasettings[0].Setup_Objects__c.split(';'));
        }
        for (Schema.SObjectType objectName : gd.values()) {
            String name = objectName.getDescribe().getName();
            if (!ignorsObject.contains(name) && !objectName.getDescribe().isCustomSetting() && objectName.getDescribe().isCreateable() 
                && objectName.getDescribe().getAssociateEntityType()!='Share' && objectName.getDescribe().getAssociateEntityType()!='Feed' && objectName.getDescribe().getAssociateEntityType()!='History') 
            {
                Schema.SObjectType objType = gd.get(name);
                Schema.DescribeSObjectResult objDescribe = objType.getDescribe();
                
                sObjectList.add(new SObjectInfo(
                    objDescribe.getLabel(),
                    objDescribe.getName()
                ));
            }
        }
        sObjectList.sort();
        return sObjectList;
    }
    
    public class SObjectInfo implements Comparable {
        @AuraEnabled
        public String label { get; set; }
        @AuraEnabled
        public String apiName { get; set; }
        
        public SObjectInfo(String label, String apiName) {
            this.label = label;
            this.apiName = apiName;
        }
        
        
        public Integer compareTo(Object compareTo) {
            SObjectInfo otherObject = (SObjectInfo)compareTo;
            return label.compareTo(otherObject.label);
        }
    }
    
    @AuraEnabled
    public static List<RecordsWrapper> countUserRecords(String userId,List<String> objList) 
    {
        List<RecordsWrapper> recordLst = new List<RecordsWrapper>();
        
        Map<String,Map<String,String>> objectfields = new Map<String,Map<String,String>>();
        Map<String,Schema.SObjectType> schemaobjtype = new Map<String,Schema.SObjectType>();
        
        for(String obName :objList ){
            Schema.SObjectType objType = Schema.getGlobalDescribe().get(obName);
            if(objType!=null){
                schemaobjtype.put(obName,objType);
            }
            
        }
        
        Map<String,String> mapObjectDetails = new Map<String,String>();
        Map<String,String> customObjIcon = getsObjectIcons();
        Integer i = 0;
        
        for ( Schema.SObjectType o : schemaobjtype.values())
        {
            String name = o.getDescribe().getName();
            if (!o.getDescribe().isCustomSetting() && o.getDescribe().isCreateable()) 
            {
                Schema.DescribeSObjectResult objResult = o.getDescribe();
                
                Map<String, Schema.SObjectField> objFields = objResult.fields.getMap();
                system.debug( 'Field size: '+objFields.size());
                system.debug('Field: '+objFields);
                Map<String,String> getObjectUserFeilds = getUserReferenceField(objResult.getName(),objFields);
                if(getObjectUserFeilds.size() > 0)
                {
                    objectfields.put(objResult.getName(),getObjectUserFeilds);
                    mapObjectDetails.put(objResult.getName(),objResult.getLabel());
                }
                
            }
        }
        
        
        Set<String> ignorsObject = new Set<String>();
        if(String.isNotBlank(u2umetasettings[0].Ignore_sObject__c)){
            ignorsObject.addAll(u2umetasettings[0].Ignore_sObject__c.split(';'));
        }
        
        Set<String> setupObjects = new Set<String>();
        if(String.isNotBlank(u2umetasettings[0].Setup_Objects__c)){
            setupObjects.addAll(u2umetasettings[0].Setup_Objects__c.split(';'));
        }
        
        for(String obj : objectfields.keySet())
        {
            if(!ignorsObject.contains(obj))
            {
                string objLabel = mapObjectDetails.get(obj);
                boolean issetupobject = false;
                
                if(setupObjects.contains(obj))
                {
                    issetupobject = true;
                }
                RecordsWrapper r = createWrapperRecord(obj,userId,objLabel,issetupobject);
                
                if(r != null)
                {
                    if(obj.contains('__c'))
                    {
                        if(String.isNotBlank(customObjIcon.get(obj))){
                            r.objIconName = 'custom:' + customObjIcon.get(obj);   
                        } else {
                            r.objIconName = 'custom:custom8';
                        }
                    } else {
                        if(obj.toLowercase() == 'emailtemplate' || obj.toLowercase() == 'contentversion' || obj.toLowercase() == 'contentdistribution')
                        {
                            r.objIconName = 'custom:custom8';    
                        } else {
                            r.objIconName = 'standard:' + obj.toLowercase();   
                        }
                    }
                    recordLst.add(r);   
                }   
            }
        }
        
        recordLst.sort();
        
        return recordLst;
    }
    
    public static RecordsWrapper createWrapperRecord(String ObjName, String userId, String objLabel, Boolean issetupobject)
    {
        List<FieldWrapper> objFields = demoObjectFields(ObjName);
        if (objFields.size() > 0)
        {
            Integer columnCount = objFields.size();
            Boolean isAnyRecordForUser = false;
            for (FieldWrapper fields : objFields)
            {
                string query = 'Select Count(Id) recCount ';
                string whquery = ' where ';
                whquery += fields.fieldAPI + '=:userId';
                query += ' from ' + ObjName + whquery;
                AggregateResult[] groupedResults = Database.query(String.escapeSingleQuotes(query));
                fields.count = Integer.valueOf(groupedResults[0].get('recCount'));
                if(fields.count > 0){
                    isAnyRecordForUser = true;
                }
            }
            if(isAnyRecordForUser){
                return new RecordsWrapper(objLabel, ObjName, objFields, null, columnCount, issetupobject);
            } else {
                return null;
            }
            
        }
        return null;
    }
    
    public static Map<String,String> getUserReferenceField(String objName,Map<String, Schema.SObjectField> objectFields)
    {
        Map<String,String> fieldnamewithobj = new Map<String,String>();
        Map<string, Map<String, Schema.SObjectField>> objectFieldsMap = new Map<string, Map<String, Schema.SObjectField>>();
        
        for(Schema.SObjectField fld :objectFields.values()){
            schema.describeFieldResult dfield = fld.getDescribe();
            
            string fldType = string.valueOf(dfield.getType());   
            if (fldType == 'REFERENCE'){ 
                string field = string.valueOf(dfield.Name);
                Schema.DescribeFieldResult f =dfield;  
                
                if(f.isUpdateable())
                {
                    for(Schema.SObjectType reference : f.getReferenceTo()) {
                        system.debug('Refe# ' +reference.getDescribe().getName());
                        if(reference.getDescribe().getName() == 'User')
                        {
                            fieldnamewithobj.put(String.valueOf(f.getSobjectField()),f.getRelationshipName());
                        }
                    }
                }
            }
        }
        return fieldnamewithobj;
    }
    
    public static List<FieldWrapper> demoObjectFields(String objName)
    {
        Map<String,String> fieldnamewithobj = new Map<String,String>();
        map<string, Map<String, Schema.SObjectField>> objectFieldsMap = new map<string, Map<String, Schema.SObjectField>>();
        Map<String, Schema.SObjectField> objectFields
            = Schema.getGlobalDescribe().get(objName).getDescribe().fields.getMap();
        List<FieldWrapper> fieldwrapp = new List<FieldWrapper>();
        for(Schema.SObjectField fld :objectFields.values()){
            schema.describeFieldResult dfield = fld.getDescribe();
            
            string fldType = string.valueOf(dfield.getType());   
            if (fldType == 'REFERENCE'){ 
                string field = string.valueOf(dfield.Name);
                Schema.DescribeFieldResult f = dfield;
                if(f.isUpdateable())
                {
                    for(Schema.SObjectType reference : f.getReferenceTo()) {
                        if(reference.getDescribe().getName() == 'User')
                        {
                            fieldwrapp.add(new FieldWrapper(f.getLabel(),f.getName(),objName));
                        }
                    }
                }
            }
        }
        return fieldwrapp;
    }
    
    @AuraEnabled
    public static void usertousermigration(String LSTusertousermigrat,String oldUserId, String newUserId){
        
        List<RecordsWrapper> fieldWrapper = (List<RecordsWrapper>)JSON.deserialize(LSTusertousermigrat, List<RecordsWrapper>.class);
        List<FieldWrapper> fieldWrapperLst = new List<FieldWrapper>();
        Set<String> uniqueObjectNames = new Set<String>();
        Integer toatalRecordsCount = 0;
        system.debug(fieldWrapper);
        for(RecordsWrapper recWrapp : fieldWrapper)
        {  
            if(!recWrapp.isSetupObject)
            {  
                for(Integer i=0;i<recWrapp.objFields.size();i++){
                    if(String.isNotBlank(recWrapp.objFields[i].userId)){
                        fieldWrapperLst.add(recWrapp.objFields[i]);
                        system.debug('fieldWrapperLst @ ' +fieldWrapperLst);
                        toatalRecordsCount += recWrapp.objFields[i].count;
                        uniqueObjectNames.add(recWrapp.objFields[i].objAPIName);
                    }
                }
            }
        }
        if(fieldWrapperLst.size() > 0) {
            Integer numberOfObjects = uniqueObjectNames.size();
            String sObjectNames = String.join(new List<String>(uniqueObjectNames), ',');
            Integer batchSize = Integer.valueOf(u2umetasettings[0].kt_u2u__Batch_Size__c);
            system.debug('Batch Size @ '+batchSize);
            
            U2U_Log__c u2uLog = new U2U_Log__c();
            u2uLog.From_User__c = oldUserId;
            u2uLog.No_of_Objects__c = numberOfObjects;
            u2uLog.sObject_Names__c = sObjectNames;
            u2uLog.No_of_Records_Processed__c = toatalRecordsCount;
            if (Schema.sObjectType.U2U_Log__c.isCreateable()) {
                System.debug('Before insert statement');
                insert u2uLog; 
                System.debug('After insert statement');
            }
            UpdateRelatedFieldBatch batchInstance = new UpdateRelatedFieldBatch(fieldWrapperLst[0].objAPIName,fieldWrapperLst[0].fieldAPI,oldUserId,fieldWrapperLst[0].userId,fieldWrapperLst,0,u2uLog.Id,u2umetasettings,0);
            Database.executeBatch(batchInstance,batchSize);
            
            
        }
        
    }
    
    
    @AuraEnabled
    public static BatchStatusWrapper checkBatchStatus() {
        List<AsyncApexJob> job = [SELECT Id, TotalJobItems, Status, JobItemsProcessed FROM AsyncApexJob WHERE ApexClass.Name = 'UpdateRelatedFieldBatch' AND Status In ('Processing','Preparing','Holding','Queued') WITH SECURITY_ENFORCED];
        System.debug('Number of Batches # '+job.size());
        if (job.size() > 0) {
            Integer res = 0;
            String batchStatus = '';
            if (job[0].JobItemsProcessed != 0 && job[0].Status == 'Processing') {
                batchStatus = 'Processing';
                res = (job[0].JobItemsProcessed * 100) / job[0].TotalJobItems;
            } else if (job[0].Status == 'Preparing' || job[0].Status == 'Holding' || job[0].Status == 'Queued') {
                batchStatus = 'Queued';
                res = 1;
            } 
            return new BatchStatusWrapper(job[0].TotalJobItems, job[0].JobItemsProcessed, res,batchStatus);   
        }
        return null;
    }
    
    
    public static Map<String,String> getsObjectIcons()
    {
        Map<String, String> iconsNamesBySObjectNames = new Map<String, String>();
        String lightningIconExt = '.svg';
        
        for(Schema.DescribeTabSetResult tsr : Schema.describeTabs()) { 
            
            if(tsr.isSelected()){
                
                for(Schema.DescribeTabResult tabResult : tsr.getTabs()){
                    
                    for(Schema.DescribeIconResult iconResult : tabResult.getIcons()){
                        String iconUrl = iconResult.getUrl();
                        if(iconUrl.endsWith(lightningIconExt)){
                            
                            iconsNamesBySObjectNames.put(tabResult.getSobjectName(), iconUrl.substringAfterLast('/').substringBefore(lightningIconExt));
                            break;
                        }
                    }    
                }
                break;
            }
        }
        
        return iconsNamesBySObjectNames;
    }
    
    public class RecordsWrapper implements Comparable
    {
        @AuraEnabled public string oldUserId {get;set;}
        @AuraEnabled public string objLabel {get;set;}
        @AuraEnabled public string objAPIName {get;set;}
        @AuraEnabled public string objIconName {get;set;}
        @AuraEnabled public string objStandardIconName {get;set;}
        @AuraEnabled public List<FieldWrapper> objFields {get;set;}
        @AuraEnabled public List<sObject> records {get;set;}
        @AuraEnabled public Boolean isSetupObject {get;set;}
        @AuraEnabled public Boolean firstObject {get;set;}
        @AuraEnabled public Integer columnCount {get;set;}
        
        
        public RecordsWrapper(String objLabel, String objAPIName, List<FieldWrapper> objFields, List<sObject> records,Integer columnCount,Boolean isSetupObject)
        {
            this.oldUserId = '';
            this.objLabel = objLabel;
            this.objAPIName = objAPIName;
            this.objIconName = '';
            this.objStandardIconName = '';
            this.objFields = objFields;
            this.records = records;
            this.columnCount = columnCount; 
            this.isSetupObject = isSetupObject;
            this.firstObject = false;
        }
        
        public Integer compareTo(Object compareTo) 
        {
            RecordsWrapper recordwrap = (RecordsWrapper) compareTo;
            if (objAPIName == recordwrap.objAPIName){
                return 0;
            } 
            if (objAPIName > recordwrap.objAPIName){
                return 1;  
            }
            
            return -1;        
        }
    }
    
    public class FieldWrapper
    {
        @AuraEnabled public string fieldLabel {get;set;}
        @AuraEnabled public string fieldAPI {get;set;}
        @AuraEnabled public string objAPIName {get;set;}
        @AuraEnabled public integer count {get;set;}
        @AuraEnabled public string userId {get;set;}  
        @AuraEnabled public string userName {get;set;}  
        @AuraEnabled public Boolean hasRecords {get;set;}
        
        public FieldWrapper(string fieldLabel,string fieldAPI, String objAPIName)
        {
            this.fieldLabel = fieldLabel;
            this.fieldAPI = fieldAPI;
            this.objAPIName = objAPIName;
            this.count = 0;
            this.userId = '';
            this.userName = '';
            this.hasRecords = false;
        }
    }
    
    public class BatchStatusWrapper {
        @AuraEnabled
        public Integer totalJobItems { get; set; }
        
        @AuraEnabled
        public Integer jobItemsProcessed { get; set; }
        @AuraEnabled
        public Integer batchProgress { get; set; }
        @AuraEnabled
        public String batchStatus { get; set; }
        
        public BatchStatusWrapper(Integer totalJobItems, Integer jobItemsProcessed,Integer batchProgress,String batchStatus) {
            this.totalJobItems = totalJobItems;
            this.jobItemsProcessed = jobItemsProcessed;
            this.batchProgress = batchProgress;
            this.batchStatus = batchStatus;
        }
    }
}