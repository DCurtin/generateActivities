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
    @track statusMessage;
    @track error;//currently not being used though I would like to implement pretty error messaging with this
    
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
            options.push({label: types[key], value:key});
        });
        return options;
    }

    constructor()
    {
        super();
        this.stateTransition(this.STATES.INIT);
    }

    //user starts here, after a file is selected by the user, they choose what type of activity it is
    setFilesAndTransitionStateToGetType(event)
    {
        this.stateTransition(this.STATES.GETTYPE)
        this.files = event.detail.files;
    }

    setType(event)//sets type via radio group
    {
        this.chosenType = this.TYPES[event.target.value];
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
    /*
        split file and pass it to the apex class for task generation
        display the results to the user.
    */
    fileParser(type){
        var reader = new FileReader();
        this.stateTransition(this.STATES.SPLIT);

        reader.readAsText(this.files[0], "UTF-8");
        reader.onload = function (evt) {
            var csv = evt.target.result;
            var rows = csv.split("\n");
            var activitiesWrapper = this.generateParamters(type,rows);

            this.stateTransition(this.STATES.GENERATETASKS);

            generateActivitiesAction({activities: activitiesWrapper})
            .then(function(result)
            {
                this.stateTransition(this.STATES.PROMPTINSERT);
                this.tasks=result;
            }.bind(this))
            .catch(error => {
                //need to create propper error reporting
                console.log(error);
                alert(error);
                //this.error = error;
            });
        }.bind(this)
    }

    /*
        Action for submitting generated activities/tasks
        If there are more then 1k itmes then it will go to a batchable
        otherwise it will attempt the upload right here and notify of
        it's success.
    */ 
    insertTasks(){
        this.stateTransition(this.STATES.INSERTING);

        if(this.tasks.length > 1000)
        {
            insertActivitiesActionBatch({ tasks: this.tasks })
            .then(function(result)
            {
                this.stateTransition(this.STATES.COMPLETE1k);
            }.bind(this))
            .catch(error => {
                //need to create propper error reporting
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

    //helper functions

    /*
        Defines each type of paramter
        I also want to add an other/custom option where
        users can provide their own arguments for these
        parameters.
    */
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
            break;
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

    /*
        Simple state setter for changing how ui elements are
        displayed based on what state the controller is in
        durring execution.
    */
    stateTransition(state)
    {   
            switch(state)
            {
                case this.STATES.INIT:

                    this.tasks              =null;
                    this.csvBlob            =null;

                    this.hideAttach         =false;
                    this.hideTypeSelection  =true;
                    this.hideStaging        =true;
                    this.hideInsert         =true;

                    this.statusMessage      ='Hello, Please attach a csv.';

                break;

                case this.STATES.GETTYPE:
                    this.tasks              =null;
                    this.chosenType         ='';

                    this.hideAttach         =true;
                    this.hideInsert         =true;
                    this.hideTypeSelection  =false;

                    this.statusMessage      ='Please choose a type of activity.';
                break;

                case this.STATES.SPLIT:

                    this.hideAttach         =true;
                    this.hideInsert         =true;
                    this.hideTypeSelection  =true;
                    this.hideStaging        =false;

                    this.statusMessage      ='Splitting CSV please wait...';
                break;

                case this.STATES.GENERATETASKS:

                    this.statusMessage      ='Generating activities please wait...';
                break;

                case this.STATES.PROMPTINSERT:

                    this.hideAttach         =false;
                    this.hideInsert         =false;

                    this.statusMessage      ='Would you like to insert these records or insert a different set?';
                break;

                case this.STATES.INSERTING:

                    this.hideAttach         =true;
                    this.hideInsert         =true;

                    this.statusMessage      ='Inserting Docs';
                break;

                case this.STATES.COMPLETE1k:

                    this.statusMessage      ='You are creating over 1000 records, you will be emailed when the job is finished. Note this can take awhile.';
                break;

                case this.STATES.COMPLETE:

                    this.statusMessage      ='Inserts Complete!';
                break;

                default:
                //set default
        }
    }


}