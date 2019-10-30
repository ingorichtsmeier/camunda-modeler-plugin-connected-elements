export default class IngoPalette {
    constructor(create, elementFactory, palette, translate) {
      this.create = create;
      this.elementFactory = elementFactory;
      this.translate = translate;
  
      palette.registerProvider(this);
    }
  
    getPaletteEntries(element) {
      const {
        create,
        elementFactory,
        translate
      } = this;

      function serviceTaskConfiguration(businessObject, name) {
        businessObject.name = name;
        businessObject.delegateExpression = '${logger}';
        businessObject.asyncBefore = true;
        return businessObject;
      }
  
      function createTaskCollection(event) {
        var moddle = elementFactory._moddle;
        const helloServicetaskShape = elementFactory.createShape({ type: 'bpmn:ServiceTask', x:0, y:0 });
        serviceTaskConfiguration(helloServicetaskShape.businessObject, 'hallo task pal');

        // How to set the parent to extensionElement?
        var failedJobRetryTmeCycle = moddle.createAny(
            'camunda:FailedJobRetryTimeCycle', 
            'http://camunda.org/schema/1.0/bpmn', 
            {$body: 'R3/PT10S'} );
        
        // How to set the parent to helloServicetaskShape.businessObject?
        var extensionElement = moddle.create('bpmn:ExtensionElements', {
            values: [ failedJobRetryTmeCycle ],
          });
        // How to add the extensionElement to the service task?
//        helloServicetaskShape.businessObject.extensionElements = extensionElement;
        console.log('the task', helloServicetaskShape);

        const exclusiveGatewayShape = elementFactory.createShape({type:'bpmn:ExclusiveGateway', x:150, y:15 });
        exclusiveGatewayShape.businessObject.name = 'continue?';

        const nextThingServiceTaskShape = elementFactory.createShape({ type: 'bpmn:ServiceTask', x:250, y:0 });
        nextThingServiceTaskShape.businessObject = serviceTaskConfiguration(nextThingServiceTaskShape.businessObject, 'Do the next thing pal');

        const otherThingServiceTaskShape = elementFactory.createShape({ type: 'bpmn:ServiceTask', x:250, y:130 });
        otherThingServiceTaskShape.businessObject = serviceTaskConfiguration(otherThingServiceTaskShape.businessObject, 'Do the other thing pal');

        const correctItServiceTaskShape = elementFactory.createShape({ type: 'bpmn:ServiceTask', x:120, y:210 });
        serviceTaskConfiguration(correctItServiceTaskShape.businessObject, 'Corrent it pal');
        //correctItServiceTaskShape.businessObject.name = 'Correct it';
        
        // No parent here, how to set?
        var error = moddle.create('bpmn:Error', {errorCode: 'abc', id: 'simpleErrorId', name: 'myErrorName'});
        console.log('error:', error); 
        // The error is not created in the XML
        
        const erroreventShape = elementFactory.createShape({ type: 'bpmn:BoundaryEvent', x:50, y:62 });
        var attachedErrorEvent = erroreventShape.businessObject;
        
        // How to set the parent to erroreventShape.businessObject?
        var erroreventDefinition = moddle.create('bpmn:ErrorEventDefinition', 
        {
          errorCodeVariable: 'errorCode',
          errorMessageVariable: 'errorMessage',
          errorRef: error
        });  
        console.log('errorEventDefinition:', erroreventDefinition);
        
        attachedErrorEvent.name = 'hallo error';
        attachedErrorEvent.attachedToRef = helloServicetaskShape.businessObject;
        attachedErrorEvent.eventDefinitions = erroreventDefinition;
        console.log('the event', attachedErrorEvent);

        // How to generate all the sequence flows needed?
        // Some need a FormularExpression
        const sequenceFlowConnection = elementFactory.createConnection({type: 'bpmn:SequenceFlow'}); //, source: servicetask, target: exclusiveGatewayShape.businessObject});

        console.log('sequence flow:', sequenceFlowConnection);
        create.start(event, [helloServicetaskShape, 
          erroreventShape, 
          exclusiveGatewayShape, 
          nextThingServiceTaskShape, 
          otherThingServiceTaskShape,
          correctItServiceTaskShape
        ]);
      }
  
      return {
        'create.task-collection': {
          group: 'activity',
          className: 'bpmn-icon-service-task',
          title: translate('Create Task Collection'),
          action: {
            dragstart: createTaskCollection,
            click: createTaskCollection
          }
        },
      }
    }
  }
  
  IngoPalette.$inject = [
    'create',
    'elementFactory',
    'palette',
    'translate'
  ];