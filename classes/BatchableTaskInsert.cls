global class BatchableTaskInsert implements Database.Batchable<SObject>, Database.Stateful {

    List<Task> batchList;
	List<Task> failedTasks;
	List<String> failedTasksCSVList;
	
	global BatchableTaskInsert(List<SObject> batchList) {
        this.batchList = batchList;
		this.failedTasks = new List<SObject>();
		this.failedTasksCSVList =new List<String>();
	}
	
	/**
	 * @description gets invoked when the batch job starts
	 * @param context contains the job ID
	 * @returns the record set as a QueryLocator object that will be batched for execution
	 */ 
	global Iterable<SObject> start(Database.BatchableContext context) {
		return this.batchList;
	}

	/**
	 * @description gets invoked when the batch job executes and operates on one batch of records. Contains or calls the main execution logic for the batch job.
	 * @param context contains the job ID
	 * @param scope contains the batch of records to process.
	 */ 
   	global void execute(Database.BatchableContext context, List<SObject> scope) {
		try{
	    	insert scope;
		}catch(System.DmlException err)
		{
			map<integer,string> errorMessage = new map<integer,string>();
			
			for(integer index=0; index<err.getNumDml(); ++index)
			{
				errorMessage.put(err.getDmlIndex(index), err.getDmlMessage(index));
			}

			//using a regular for loop so that I can reference index for getting the right error message
			for(integer index=0; index<scope.size(); ++index)
			{
				Sobject failedTask = scope.get(index);

				Map<string,object> failedTaskMap = failedTask.getPopulatedFieldsAsMap();
				if(failedTasksCSVList.size() == 0)
				{
					List<string> failedTaskKeys = new List<string>();
					failedTaskKeys.addAll(failedTaskMap.keySet());
					string header= String.join(failedTaskKeys,',');
					failedTasksCSVList.add(header + ',DML Error' + '\n');
				}
				List<object> failedTaskValues = failedTaskMap.values();
				String failedTaskLine = String.join(failedTaskValues, ',');
				
				string dmlError = errorMessage.get(index);
				dmlError = dmlError == null? '':dmlError;

				this.failedTasksCSVList.add(failedTaskLine +',' + dmlError + '\n');
				
				

				
			}		
		}
	}

	/**
	 * @description gets invoked when the batch job finishes. Place any clean up code in this method.
	 * @param context contains the job ID
	 */ 
	global void finish(Database.BatchableContext context) {
		//send email on completion.
		Messaging.SingleEmailMessage EmailMessage = new Messaging.SingleEmailMessage();
		List<String> recipents=new List<String>();
		recipents.add('dcurtin@midlandira.com');

		EmailMessage.toAddresses = recipents;
		EmailMessage.subject = 'Test';
		EmailMessage.plainTextBody = 'This is a test';

		Messaging.EmailFileAttachment efa = new Messaging.EmailFileAttachment();
		efa.setFileName('Test File.csv');

		String failedTasksCSV = '';
		for(String failedTaskCsvLine :this.failedTasksCSVList)
		{
			failedTasksCSV += failedTaskCsvLine;
		}
		System.debug('Failed finish: ' + failedTasksCSV);
		efa.setBody(Blob.valueof(failedTasksCSV));

		EmailMessage.setFileAttachments(new Messaging.EmailFileAttachment[] {efa});

		Messaging.SendEmail(new Messaging.SingleEmailMessage[] {EmailMessage});

	}
}