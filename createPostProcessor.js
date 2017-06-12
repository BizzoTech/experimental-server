const R = require('ramda');
const {runFor} = require('./utils');
const {mainDb, publicDb} = require('./config');

const createPostProcessor = (postProcessorName, updateEvent) => {
	const getEventsWaitingForPostProcessing = async() => {
		const result = await mainDb.find({
			selector: {
				type: "EVENT",
				status: "postProcessing",
				postProcessor: postProcessorName
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

	const handleAction = async(event) => {
		const {action} = event;
		try {
			const currentPostProcessor = event.postProcessors.find(p => p.name === postProcessorName);
			if (currentPostProcessor.status === "done") {
				return;
			}

			const updatedEvent = await updateEvent(event) || event;

			const currentPostProcessorIndex = event.postProcessors.indexOf(currentPostProcessor);
			const updatedPostProcessor = R.merge(currentPostProcessor, {status: "done"});
			const postProcessors = R.update(currentPostProcessorIndex, updatedPostProcessor, event.postProcessors);
			await mainDb.put(R.merge(updatedEvent, {postProcessors}));
		} catch (e) {
			console.log(e);
			await markActionAsError(event, e);
		}
	}

	const handleEvents = async() => {
    const events = await getEventsWaitingForPostProcessing();
    console.log("Events waiting for " + postProcessorName + " " + events.length);
    for (event of events) {
      await handleAction(event);
    }
	}
  
	return () => runFor(handleEvents, 1000 * 60 * 15, postProcessorName);
}

module.exports = createPostProcessor;
