global class BatchableTaskInsert implements Database.Batchable<SObject> {

    List<Task> batchList;
	
	global BatchableTaskInsert(List<Task> batchList) {
        this.batchList = batchList;
		
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
	    insert scope;
	}
	
	/**
	 * @description gets invoked when the batch job finishes. Place any clean up code in this method.
	 * @param context contains the job ID
	 */ 
	global void finish(Database.BatchableContext context) {
		//send email on completion.
	}
}