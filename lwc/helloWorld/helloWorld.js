/* eslint-disable no-console */
/* eslint-disable no-alert */
import { LightningElement, track, wire} from 'lwc';
import generateActivitiesAction from '@salesforce/apex/CreateActivitiesController.generateActivitiesAction';
import insertActivitiesAction from '@salesforce/apex/CreateActivitiesController.insertActivitiesAction';

export default class HelloWorld extends LightningElement {
    //@wire(generateActivitiesAction, {csvBlob:"$csvBlob"})
    csvBlob = null;
    @wire(generateActivitiesAction, { csvBlob: '$csvBlob' })
    tasks = null;
    @track statusMessage = 'Hello, please attach a csv.';
    @track error;
    @track disableButton = true;
    
    @track hideAttach = false;
    @track hideInsert = true;

    STATES = {
        INIT: 'init',
        UPLOAD: 'upload',
        COMPLETE: 'complete'
    }

    //get subject(){ return this.task.data ? getSObjectValue(this.task.data, SUBJECT_FIELD) : '';}
    constructor()
    {
        super();
        this.stateTransition(this.STATES.INIT);
    }


    insertTasks(){
        /*var tasks = JSON.stringify(this.tasks);
        console.log(tasks);*/
        this.uploadStatus = "Uploading...";
        insertActivitiesAction({ tasks: this.tasks.data })
            .then(function(result)
            {
                //this.tasks=result;
                this.uploadStatus = "Complete";
            }.bind(this))
            .catch(error => {
                this.uploadStatus= "Error";
                console.log(error);
                alert(error);
                //this.error = error;
            });
    }

    fileParser(event){
        var reader = new FileReader();
        const ufiles = event.detail.files;
        this.initStatus='Splitting Sheet';
        //this.greeting = ufiles[0].toString();
        //alert("No. of files uploaded : " + ufiles.length);
        
        
        reader.readAsText(ufiles[0], "UTF-8");
        reader.onload = function (evt) {
            var csv = evt.target.result;
            var rows = csv.split("\n");
            this.initStatus='Splitting Complete, Generating Tasks...';
            //var row;
            //console.log("EVT FN");
            //console.log('@@@ csv file contains'+ csv);
            
            //console.log("split successful");
            //this.greeting = row;
            this.csvBlob = rows;
            //this.greeting ='generating tasks, please wait.'
            /*generateActivitiesAction({ csvBlob: this.csvBlob })
            .then(function(result)
            {
                this.tasks=result;
                this.greeting = "TEST";
            }.bind(this))
            .catch(error => {
                console.log(error);
                alert(error);
                //this.error = error;
            });*/
            //var result = helper.CSV2JSON(component,csv);
            //console.log('@@@ result = ' + result);
            //console.log('@@@ Result = '+JSON.parse(result));
            //helper.CreateAccount(component,result);
            
        }.bind(this)
    }

    stateTransition(state)
    {
        //if state is init 
    }


}