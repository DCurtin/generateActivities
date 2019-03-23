/*
    NOTES
    Get uploader ID or have id or name provided in csv

*/
public with sharing class CreateActivitiesController
{
    //public Blob csvFileBody{get;set;}
    ///public string csvAsString{get;set;}
    //private List<Task> tasksToImport = new List<Task>();

    
    public CreateActivitiesController()
    {}
    
    
    
    @AuraEnabled
    public static List<Task> insertActivitiesAction(List<task> tasks)
    {
        /*
        //pushing update
        map<string,list<Task>> desTasks = new map<string,list<Task>>();
        desTasks= (map<string,list<Task>>) Json.deserialize(tasks, map<string,list<Task>>.class);
        
        
        System.debug(desTasks);
        
        insert desTasks.get('data');
        return desTasks.get('data');
		*/
        if(tasks.size() > 1000)
        {
            System.debug('Batching Task');
            BatchableTaskInsert batchTask = new BatchableTaskInsert(tasks);
            Database.executeBatch(batchTask);
        }else
        {
            insert tasks;
        }
        return tasks;
    }

    @AuraEnabled(cacheable=true)
    public static List<Task> generateActivitiesAction(list<String> csvBlob)
    {
        map<string,string> columnNamesMap = new map<string,string>{'Account #: Client Contact ID'=>'WhoId', 'Account #: Account ID'=>'WhatId'};
        
        System.debug('generating avtivities');
        if(csvBlob==null || csvBlob.size() == 0)
        {
            return null;
        }
        
        
         List<String> csvLines = csvBlob; //.split('\n');//csvFileBody.toString().split('\n');
         list<String> header = csvLines.remove(0).split(',');
         //send header through validation function to check that it is correct
         Map<string, integer>columnMapping = getColumnMapping(header, columnNamesMap);
         System.debug(columnMapping);
         
         List<Task> tasksToImport = generateTasks(csvLines,columnMapping);
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

    private static List<Task> generateTasks(List<String> csvLines, Map<String,Integer> columnMapping)
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
            Task newTask = generateMailMonthlyStatementTask(items,columnMapping);
            //add to list tasksToImport
            tasksToImport.add(newTask);  
         }
         return tasksToImport;
    }

    

    private static Task generateMailMonthlyStatementTask(List<String> items, Map<String,Integer> columnMapping)
    {
        Task newTask = new Task();

        newTask.WhatId          =   (id)'0014D00000GOalNQAT';//(id)items[columnMapping.get('WhatId')];
        newTask.WhoId           =   (id)'0034D00000KWgvGQAT';//(id)items[columnMapping.get('WhoId')];
        newTask.RecordTypeId    =   (id)'01230000000iJsSAAU';//id lookup via developer name
        newTask.Type            =   'Mail';
        newTask.Status          =   'Completed';
        newTask.Subject         =   'Mail: Monthly Statement';
        newTask.ActivityDate    =   Date.today();
        newTask.OwnerId         =   System.UserInfo.getUserId(); //lookup by query or get id of uploader
        newTask.Description     =   'Mailed out monthly statement';

        return newTask;
    }
}