
public with sharing class ActivitiesWrapper {
    /*
    class InnerWrapper
    {
        @AuraEnabled
        public List<string> innerCsvLines {get; set;}
        @AuraEnabled
        public Map<String,string> innerOptions{get; set;}
    }*/      

    @AuraEnabled
    public List<string> csvLines {get; set;}
    @AuraEnabled
    public Map<String,string> options{get; set;}
    //@AuraEnabled
    //public list<InnerWrapper> activitiesList {get; set;}
}