/* eslint-disable no-console */
/* eslint-disable no-alert */
import { LightningElement, track, wire} from 'lwc';
import generateActivitiesAction from '@salesforce/apex/CreateActivitiesController.generateActivitiesAction';
import insertActivitiesAction from '@salesforce/apex/CreateActivitiesController.insertActivitiesAction';

export default class HelloWorld extends LightningElement {
    //@wire(generateActivitiesAction, {csvBlob:"$csvBlob"})
    csvBlob = null;
    //@wire(generateActivitiesAction, { csvBlob: '$csvBlob' })
    @track tasks;
    @track statusMessage;// = 'Hello, please attach a csv.';
    @track error;
    
    @track hideAttach;
    @track hideInsert;

    STATES = {
        INIT:           'init',
        SPLIT:          'split',
        GENERATETASKS:  'generateTasks',
        PROMPTINSERT:   'promptInsert',
        INSERTING:      'inserting',
        COMPLETE1k:     'complete1k',
        COMPLETE:       'complete'
    }
    //currentState = STATES.INIT;

    //get subject(){ return this.task.data ? getSObjectValue(this.task.data, SUBJECT_FIELD) : '';}
    constructor()
    {
        super();
        this.stateTransition(this.STATES.INIT);
    }

    insertTasks(){
        /*var tasks = JSON.stringify(this.tasks);
        console.log(tasks);*/
        this.stateTransition(this.STATES.INSERTING);
        insertActivitiesAction({ tasks: this.tasks })
            .then(function(result)
            {
                //this.tasks=result;
                if(true)//(this.tasks.length > 1000)
                {
                    this.stateTransition(this.STATES.COMPLETE1k);
                }else
                {
                    this.stateTransition(this.STATES.COMPLETE);
                }

            }.bind(this))
            .catch(error => {

                console.log(error);
                alert(error);
                //this.error = error;
            });
    }

    fileParser(event){
        var reader = new FileReader();
        this.stateTransition(this.STATES.SPLIT);

        const ufiles = event.detail.files;

        reader.readAsText(ufiles[0], "UTF-8");
        reader.onload = function (evt) {
            var csv = evt.target.result;
            var rows = csv.split("\n");
            this.stateTransition(this.STATES.GENERATETASKS);
            //var row;
            //console.log("EVT FN");
            //console.log('@@@ csv file contains'+ csv);
            
            //console.log("split successful");
            //this.greeting = row;
            this.csvBlob = rows;
            //this.greeting ='generating tasks, please wait.'
            generateActivitiesAction({ csvBlob: this.csvBlob })
            .then(function(result)
            {
                this.stateTransition(this.STATES.PROMPTINSERT);
                this.tasks=result;
            }.bind(this))
            .catch(error => {
                console.log(error);
                alert(error);
                //this.error = error;
            });
            //var result = helper.CSV2JSON(component,csv);
            //console.log('@@@ result = ' + result);
            //console.log('@@@ Result = '+JSON.parse(result));
            //helper.CreateAccount(component,result);
            
        }.bind(this)
    }

    stateTransition(state)
    {
        switch(state)
        {
            case this.STATES.INIT:
            //set initial state clearing tasks/csvBlob
            //and showing attach/hiding insert
            //and initial message

            this.tasks = null;
            this.csvBlob = null;

            this.hideAttach=false;
            this.hideInsert=true;

            this.statusMessage='Hello, Please attach a csv.';

            break;

            case this.STATES.SPLIT:
            //hide attach
            //change message

            this.hideAttach=true;
            this.hideInsert=true;
            
            this.statusMessage='Splitting CSV please wait...';
            break;

            case this.STATES.GENERATETASKS:
            //change message

            this.statusMessage='Generating activities please wait...';
            break;

            case this.STATES.PROMPTINSERT:
            //show attach
            //show insert
            //prompt to insert current tasks for start over

            this.hideAttach=false;
            this.hideInsert=false;

            this.statusMessage='Would you like to insert these records or insert a different set?';
            break;

            case this.STATES.INSERTING:
            //hide attach
            //hide insert
            //change message

            this.hideAttach=true;
            this.hideInsert=true;

            this.statusMessage='Inserting Docs';
            break;

            case this.STATES.COMPLETE1k:
            //if count > 1k notify user that a batch job started
            //they will receive and email when finished

            this.statusMessage='You are creating over 1000 records, you will be emailed when the job is finished. Note this can take awhile.';
            break;

            case this.STATES.COMPLETE:
            //notify user inserts are complete

            this.statusMessage='Inserts Complete!';
            break;

            default:
            //set default
        }
    }


}