/* eslint-disable no-console */
/* eslint-disable no-alert */
import { LightningElement, track} from 'lwc';
import generateActivitiesAction from '@salesforce/apex/CreateActivitiesController.generateActivitiesAction';
import insertActivitiesAction from '@salesforce/apex/CreateActivitiesController.insertActivitiesAction';
import insertActivitiesActionBatch from '@salesforce/apex/CreateActivitiesController.insertActivitiesActionBatch';

export default class generateActivities extends LightningElement {
    description="";
    subject="";
    task="";
    csvBlob = null;
    files= [];

    @track chosenType = '';

    @track tasks;
    @track statusMessage;// = 'Hello, please attach a csv.';
    @track error;
    
    @track hideAttach;
    @track hideInsert;
    @track hideTypeSelection;
    @track hideStaging;

    STATES = {
        INIT:           'init',
        GETTYPE:        'getType',
        SPLIT:          'split',
        GENERATETASKS:  'generateTasks',
        PROMPTINSERT:   'promptInsert',
        INSERTING:      'inserting',
        COMPLETE1k:     'complete1k',
        COMPLETE:       'complete'
    }

    TYPES = {
        FMV:        'FMV',
        MATURES:    'Matured Note',
        MONTHLY:    'Monthly Statement'
    }

    get options() {//generate options for radio group from TYPES dictionary
        return this.generateOptionsFromTypes(this.TYPES);
    }

    generateOptionsFromTypes(types)
    {
        let options= [];
        
        Object.keys(types).forEach(key => {
            console.log(types[key]);
            options.push({label: types[key], value:key});
        });
        return options;
    }

    constructor()
    {
        super();
        this.stateTransition(this.STATES.INIT);
    }

    
    
    setType(event)
    {
        this.chosenType = event.target.value;
    }

    setFilesAndTransitionStateToGetType(event)
    {
        this.stateTransition(this.STATES.GETTYPE)
        this.files = event.detail.files;
    }

    insertTasks(){
        /*var tasks = JSON.stringify(this.tasks);
        console.log(tasks);*/
        //this.stateTransition(this.STATES.COMPLETE1k);
        this.stateTransition(this.STATES.INSERTING);

        if(this.tasks.length > 1000)
        {
            insertActivitiesActionBatch({ tasks: this.tasks })
            .then(function(result)
            {
                this.stateTransition(this.STATES.COMPLETE);
            }.bind(this))
            .catch(error => {
                console.log(error);
                alert(error);
            });
        }else
        {
            insertActivitiesAction({ tasks: this.tasks })
            .then(function(result)
            {
                this.stateTransition(this.STATES.COMPLETE);
            }.bind(this))
            .catch(error => {
                console.log(error);
                alert(error);
            });

        }
    }

    checkRadioSelectedAndTransitionToSplit()
    {
        if(this.chosenType==='')
        {
            alert("Please choose a type of activity.");
            return;
        }
        this.fileParser(this.chosenType);
    }


    fileParser(type){
        var reader = new FileReader();
        this.stateTransition(this.STATES.SPLIT);


        reader.readAsText(this.files[0], "UTF-8");
        reader.onload = function (evt) {
            var csv = evt.target.result;
            var rows = csv.split("\n");
            var activitiesWrapper = this.generateParamters(type,rows);
            //this.csvBlob = rows;
    
            this.stateTransition(this.STATES.GENERATETASKS);
            //var row;
            //console.log("EVT FN");
            //console.log('@@@ csv file contains'+ csv);
            
            //console.log("split successful");
            //this.greeting = row;
            
            //this.greeting ='generating tasks, please wait.'
            /*invokeCallArgument = { 
                
                csvBlob: this.csvBlob }*/
            generateActivitiesAction({activities: activitiesWrapper})
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

    generateParamters(type,rows)
    {
        switch(type)
        {
            case this.TYPES.FMV:
                return {
                    csvLines:   rows,
                    options:    {Type:          'Mail',
                                 Subject:       'Mail: FMV ',
                                 Description:   'Mailed out FMV',
                                 Status:        'Completed',
                                 }
                }
            case this.TYPES.MATURES:
                return {
                    csvLines:   rows,
                    options:    {Type:          'Mail',
                                 Subject:       'Mail: Matured Note Notice',
                                 Description:   'Mailed out mature note notice',
                                 Status:        'Completed',
                                 }
                }
            case this.TYPES.MONTHLY:
                return {
                    csvLines:   rows,
                    options:    {Type:          'Mail',
                                 Subject:       'Mail: Monthly Statement',
                                 Description:   'Mailed out monthly statement',
                                 Status:        'Completed',
                                 }
                }
            default:
                return null;
        }
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
            this.hideTypeSelection=true;
            this.hideStaging=true;
            this.hideInsert=true;

            this.statusMessage='Hello, Please attach a csv.';

            break;

            case this.STATES.GETTYPE:
            this.statusMessage='Please choose a type of activity.';
            this.hideAttach=true;
            this.hideTypeSelection=false;
            break;

            case this.STATES.SPLIT:
            //hide attach
            //change message

            this.hideAttach=true;
            this.hideInsert=true;
            this.hideTypeSelection=true;
            this.hideStaging=false;

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