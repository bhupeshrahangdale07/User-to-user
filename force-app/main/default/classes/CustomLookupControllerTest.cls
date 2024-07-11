@IsTest
public class CustomLookupControllerTest {
    @isTest
    static void getLookupSerachRecordsTest() {
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < 5; i++) {
            accounts.add(new Account(Name='Test Account ' + i));
        }
        insert accounts;
        
        
        List<Account> results = CustomLookupController.getLookupSerachRecords('Test', 'Account', 5);
        
        
        System.assertEquals(5, results.size());
        for (Integer i = 0; i < 5; i++) {
            System.assertEquals('Test Account ' + i, results[i].Name);
        }
    }
    
    @isTest
    static void findRecordsTest() {
        List<User> users = new List<User>();
        
        for (Integer i = 0; i < 5; i++) {
            
            users.add(new User(
                Username='testuserk' + i + '@examplekt_u2u.com',
                LastName='Test',
                Email='testuser' + i + '@example.com',
                Alias='testu' + i,
                TimeZoneSidKey='America/New_York',
                EmailEncodingKey='UTF-8',
                LanguageLocaleKey='en_US',
                LocaleSidKey='en_US',
                ProfileId = UserInfo.getProfileId()
            ));
        }
        insert users;
        
        
        List<SObject> results = CustomLookupController.findRecords('testuser', 'User', 'Username');
        
        System.assertEquals(5, results.size());
        for (Integer i = 0; i < 5; i++) {
            System.assertEquals('testuserk' + i + '@examplekt_u2u.com', results[i].get('Username'));
        }
    }
    
    @isTest
    static void countUserRecordsTest() {
        User u = new User(
            Alias = 'testu',
            Email = 'testuser@example.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'Last Name',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            TimeZoneSidKey = 'America/New_York',
            UserName = 'testuser12@examplekt_u2u.com.kt',
            ProfileId = UserInfo.getProfileId()
        );
        insert u;
        
        User testUser = new User(
            FirstName = 'Test',
            LastName = 'User',
            Username = 'testuserfge@example.com.rhr',
            Email = 'testuser@example.com',
            Alias = 'tuser',
            CommunityNickname = 'testuser',
            TimeZoneSidKey = 'America/Los_Angeles',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            ProfileId = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1].Id,
            LanguageLocaleKey = 'en_US'
        );
        insert testUser;
        
        Account a = new Account(Name='Test Account');
        a.OwnerId = u.Id;
        insert a;
        
        T__c testtobj = new T__c(
                Name = 'Test T',
                OwnerId = u.Id
            );
        insert testtobj;
        
        Test.StartTest();
        List<String> result = CustomLookupController.getAllObj();
        List<CustomLookupController.SObjectInfo> results = CustomLookupController.getSObjects();
        System.assertNotEquals(0, results.size());
        List<CustomLookupController.RecordsWrapper> results2 = CustomLookupController.countUserRecords(u.Id, new List<String>{'Account','kt_u2u__T__c'});
        for(CustomLookupController.RecordsWrapper r : results2) {
            for(Integer i=0;i<r.objFields.size();i++){
                r.objFields[i].userId = UserInfo.getUserId();
            }
        }
        CustomLookupController.usertousermigration(JSON.serialize(results2), u.Id, UserInfo.getUserId());
        Test.StopTest();
    }
}