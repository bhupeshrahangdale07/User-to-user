@isTest
public class ICONDemoTest {

    @isTest
    static void testGetIconName() {
      
        String customObjectName = 'Custom_Object__c';
        ICONDemo iconDemo = new ICONDemo(); 
        Test.startTest();
        String iconNameCustom = iconDemo.getIconName(customObjectName);
       
        String standardObjectName = 'Account'; 
        iconDemo = new ICONDemo(); 
        
        String iconNameStandard = iconDemo.getIconName(standardObjectName);
        Test.stopTest();
       
    }
}