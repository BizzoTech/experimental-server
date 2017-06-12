const R = require('ramda');
const {runFor} = require('./utils');
const {mainDb, publicDb} = require('./config');

const createPreProcessor = (preProcessorName, updateEvent) => {

	const getEventsWaitingForPreProcessing = async() => {
		const result = await mainDb.find({
			selector: {
				type: "EVENT",
				status: "preProcessing",
				preProcessor: preProcessorName
			},
			sort: [
				{
					createdAt: "asc"
				}
			]
		});
		return result.docs;
	}

	const markActionAsError = (event, err) => {
		return mainDb.put(R.merge(event, {
			status: "error",
			error: err
		}));
	}

	const handleEvent = async(event) => {
		const {action} = event;
		try {
			const currentPreProcessor = event.preProcessors.find(p => p.name === preProcessorName);
			if (currentPreProcessor.status === "done") {
				return;
			}

			const updatedEvent = await updateEvent(event) || event;

			const currentPreProcessorIndex = event.preProcessors.indexOf(currentPreProcessor);
			const updatedPreProcessor = R.merge(currentPreProcessor, {status: "done"});
			const preProcessors = R.update(currentPreProcessorIndex, updatedPreProcessor, event.preProcessors);
			await mainDb.put(R.merge(updatedEvent, {preProcessors}));
		} catch (e) {
			console.log(e);
			await markActionAsError(event, e);
		}

	}



	const handleEvents = async() => {
    const events = await getEventsWaitingForPreProcessing();
    console.log("Events waiting for " + preProcessorName + " " + events.length);
    for (event of events) {
      await handleEvent(event);
    }
	}
  
	return () => runFor(handleEvents, 1000 * 60 * 15, preProcessorName);
}

module.exports = createPreProcessor;
