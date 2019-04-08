/*
    NOTES
    Get uploader ID or have id or name provided in csv

*/
public with sharing class CreateActivitiesController
{
    //should really change this to a user provided argument that his thoroughly checked 
    //currently only two task types and All Tasks is seemingly used for everything.
    private static final id RECORDTYPEID = Schema.SObjectType.Task.getRecordTypeInfosByName().get('All Tasks').getRecordTypeId();
    
    public CreateActivitiesController()
    {}
    
    @AuraEnabled
    public static List<Task> insertActivitiesAction(List<task> tasks)
    {
        insert tasks;        
        return tasks;
    }

    @AuraEnabled
    public static void insertActivitiesActionBatch(list<task> tasks){
        System.debug('Batching Task');
        BatchableTaskInsert batchTask = new BatchableTaskInsert(tasks);
        Database.executeBatch(batchTask);
    }
    

    @AuraEnabled(cacheable=false)//can't be cacheable if provided activities can change
    public static List<Task> generateActivitiesAction(ActivitiesWrapper activities)
    {
        system.debug('TEST: ' + activities.options.get('Subject'));
        if(activities==null)
        {
            System.debug('No activities set.');
            return null;
        }
        
        map<string,string> columnNamesMap = new map<string,string>{'Account #: Client Contact ID'=>'WhoId', 'Account #: Account ID'=>'WhatId'};
        map<string, string> options = activities.options;
        System.debug('generating avtivities');
        
        
        
         List<String> csvLines = activities.csvLines;
         list<String> header = csvLines.remove(0).split(',');
         //send header through validation function to check that it is correct
         Map<string, integer>columnMapping = getColumnMapping(header, columnNamesMap);
         System.debug(columnMapping);
         
         List<Task> tasksToImport = generateTasks(csvLines,columnMapping, options);
         //import
        //insert tasksToImport;
        return tasksToImport;
    }

    private static Map<String,integer> getColumnMapping(list<string> header, map<string,string> columnNamesMap)
    {
        Map<String,integer> idindexes = new Map<String,integer>();
        for(string name : columnNamesMap.keySet())
        {
            integer index = header.indexOf(name);
            if(index > -1)
            {
            	idindexes.put(columnNamesMap.get(name),index);
            }
            
        }
        return idindexes;
    }

    private static List<Task> generateTasks(List<String> csvLines, Map<String,Integer> columnMapping, Map<string, string>options)
    {
        List<Task> tasksToImport = new List<Task>();
        for(String line : csvLines)
         {
            List<String> items = line.split(',');
             if(items.size() < 2)
             {
                 continue;
             }
            //create record
            Task newTask = generateMailMonthlyStatementTask(items,columnMapping,options);
            //add to list tasksToImport
            tasksToImport.add(newTask);  
         }
         return tasksToImport;
    }

    /*
        generateTransactionsAssignToUser()
        
    
    */

    
    //this is for tasks, there should be another function for transactions
    private static Task generateMailMonthlyStatementTask(List<String> items, Map<String,Integer> columnMapping, Map<string, string>options)
    {
        Task newTask = new Task();
        //get from csv
        newTask.WhatId          =   (id)items[columnMapping.get('WhatId')];
        newTask.WhoId           =   (id)items[columnMapping.get('WhoId')];

        //get from user, either csv or input
        newTask.RecordTypeId    =   RECORDTYPEID;//(id)'01230000000iJsSAAU';//id lookup via developer name
        string Type             =   options.get('Type');//items[columnMapping.get('Type')];
        newTask.Type            =   type==null?'Mail':type;
        newTask.Subject         =   options.get('Subject');
        newTask.Description     =   options.get('Description');
        newTask.Status          =   options.get('Status');

        //static or automagically retrieved  
        newTask.ActivityDate    =   Date.today();
        newTask.OwnerId         =   System.UserInfo.getUserId(); //lookup by query or get id of uploader

        return newTask;
    }
}




