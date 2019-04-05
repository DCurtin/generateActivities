
public with sharing class ActivitiesWrapper {
    @AuraEnabled
    public List<string> csvLines {get; set;}
    @AuraEnabled
    public Map<String,string> options{get; set;}
}