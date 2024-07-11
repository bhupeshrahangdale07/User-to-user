@isTest
public class User2UserSetupTest {
    @isTest
    static void testGetCustomMetadata() {
        Test.startTest();
        U2U_Setting__mdt resultMetadata = User2UserSetup.getCustomMetadata();
        Test.stopTest();
    }
    
    @isTest
    static void testUpdateCustomMetadata() {
        Test.startTest();
        User2UserSetup.updateCustomMetadata(false, 200, true);
        Test.stopTest();
    }
}