export default class ConnectedElementsPalette {
  constructor(bpmnFactory, bpmnJs, create, elementFactory, palette, translate) {
    this.bpmnFactory = bpmnFactory;
    this.bpmnJs = bpmnJs;
    this.create = create;
    this.elementFactory = elementFactory;
    this.translate = translate;
    palette.registerProvider(this);
  }
  
  getPaletteEntries(element) {
    const {
      bpmnFactory,
      bpmnJs,
      create,
      elementFactory,
      translate,
    } = this;

    function serviceTaskConfiguration(businessObject, name, delegateExpression) {
      businessObject.name = name;
      businessObject.delegateExpression = delegateExpression;
      businessObject.asyncBefore = true;
      return businessObject;
    }

    function createConnection(sourceShape, targetShape, waypoints) {
      return elementFactory.createConnection({type: 'bpmn:SequenceFlow', 
        source: sourceShape, 
        target: targetShape, 
        waypoints: waypoints
      });
    }

    function createTaskCollection(event) {
      // extension element for the retry time cycle
      var failedJobRetryTmeCycle = bpmnFactory.create('camunda:FailedJobRetryTimeCycle', {
        body: 'R3/PT10S'
      });
        
      var r3pt10sExtensionElement = bpmnFactory.create('bpmn:ExtensionElements', {
        values: [ failedJobRetryTmeCycle ]
      });

      const invokeMyServicetaskShape = elementFactory.createShape({ type: 'bpmn:ServiceTask', x:0, y:0 });
      serviceTaskConfiguration(invokeMyServicetaskShape.businessObject, 'Invoke my service', '${logger}');
      invokeMyServicetaskShape.businessObject.extensionElements = r3pt10sExtensionElement;
      //console.log('the task', helloServicetaskShape);

      const exclusiveGatewayShape = elementFactory.createShape({type:'bpmn:ExclusiveGateway', x:150, y:15 });
      exclusiveGatewayShape.businessObject.name = 'continue?';

      const nextThingServiceTaskShape = elementFactory.createShape({ type: 'bpmn:ServiceTask', x:250, y:0 });
      serviceTaskConfiguration(nextThingServiceTaskShape.businessObject, 'Invoke the next service', '${logger}');
      nextThingServiceTaskShape.businessObject.extensionElements = r3pt10sExtensionElement;

      const otherThingServiceTaskShape = elementFactory.createShape({ type: 'bpmn:ServiceTask', x:250, y:130 });
      serviceTaskConfiguration(otherThingServiceTaskShape.businessObject, 'Do something else', '${logger}');
      otherThingServiceTaskShape.businessObject.extensionElements = r3pt10sExtensionElement;

      const correctItServiceTaskShape = elementFactory.createShape({ type: 'bpmn:ServiceTask', x:120, y:210 });
      serviceTaskConfiguration(correctItServiceTaskShape.businessObject, 'Correct the error', '${logger}');
      correctItServiceTaskShape.businessObject.extensionElements = r3pt10sExtensionElement;
      
      var definitions = bpmnJs.getDefinitions();
      var error = bpmnFactory.create('bpmn:Error', {errorCode: 'abc', name: 'myErrorName'});
      definitions.get('rootElements').push(error);
      
      // error event definition
      var erroreventDefinition = bpmnFactory.create('bpmn:ErrorEventDefinition', {
        errorCodeVariable: 'errorCode',
        errorMessageVariable: 'errorMessage',
        errorRef: error
      });    
      //console.log('errorEventDefinition:', erroreventDefinition);
      
      // attached boundary error event
      const erroreventShape = elementFactory.createShape({ type: 'bpmn:BoundaryEvent', x:50, y:62 });
      erroreventShape.businessObject.name = 'hallo error';
      erroreventShape.businessObject.attachedToRef = invokeMyServicetaskShape.businessObject;
      erroreventShape.businessObject.eventDefinitions = [erroreventDefinition];
      erroreventShape.host = invokeMyServicetaskShape;
      //console.log('the event', erroreventShape);

      erroreventDefinition.$parent = erroreventShape.businessObject;

      const sequenceFlowMyServiceExclusive = 
        createConnection(invokeMyServicetaskShape, exclusiveGatewayShape, [{x:100, y:40}, {x:150, y:40}]);
      
      // need a FormularExpression
      const sequenceFlowExclusiveNext = 
        createConnection(exclusiveGatewayShape, nextThingServiceTaskShape, [{x:200, y:40}, {x:250, y:40}]);
      sequenceFlowExclusiveNext.businessObject.name = 'yes';
      sequenceFlowExclusiveNext.businessObject.conditionExpression = 
        bpmnFactory.create('bpmn:FormalExpression', {body: '${continue}'});
      //console.log('conditional sequence flow: ', sequenceFlowExclusiveNext);

      const sequenceFlowExclusiveOther = 
        createConnection(exclusiveGatewayShape, otherThingServiceTaskShape, [{x:175, y:60}, {x:175, y:170}, {x:250, y:170}]);
      sequenceFlowExclusiveOther.businessObject.name = 'no';
      sequenceFlowExclusiveOther.businessObject.conditionExpression = 
        bpmnFactory.create('bpmn:FormalExpression', {body: '${not continue}'});

      const sequenceFlowErrorCorrect = 
        createConnection(erroreventShape, correctItServiceTaskShape, [{x:68, y:98}, {x:68, y:250}, {x:120, y:250}]);

      const sequenceFlowCorrectHello = 
        createConnection(correctItServiceTaskShape, invokeMyServicetaskShape, 
          [{x:220, y:250}, {x:250, y:250}, {x:250, y: 320}, {x:-30, y:320}, {x:-30, y:50}, {x:0, y:50}]);

      create.start(event, [
        invokeMyServicetaskShape, 
        erroreventShape, 
        exclusiveGatewayShape, 
        nextThingServiceTaskShape, 
        otherThingServiceTaskShape,
        correctItServiceTaskShape,
        sequenceFlowMyServiceExclusive,
        sequenceFlowExclusiveNext,
        sequenceFlowExclusiveOther,
        sequenceFlowErrorCorrect,
        sequenceFlowCorrectHello
      ]);
    }

    return {
      'create.task-collection': {
        group: 'activity',
        className: 'bpmn-icon-intermediate-event-catch-error',
        title: translate('Create Task Collection'),
        action: {
          dragstart: createTaskCollection,
          click: createTaskCollection
        }
      },
    }
  }
}
  
ConnectedElementsPalette.$inject = [
  'bpmnFactory',
  'bpmnjs',
  'create',
  'elementFactory',
  'palette',
  'translate'
];