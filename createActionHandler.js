const R = require('ramda');
const {runFor} = require('./utils');
const {mainDb, publicDb} = require('./config');

const createActionHandler = actionHandlers => {
  const actionHandlersKeys = R.flatten(Object.values(actionHandlers).map(hs => Object.keys(hs)));
	const getInProcessEvents = async() => {
		const result = await mainDb.find({
			selector: {
				type: "EVENT",
				status: "processing"
			},
			sort: [
				{
					createdAt: "asc"
				}
			]
		});
		return result.docs;
	}

	const updateEventAppliedOn = (event, doc) => {
		return R.assocPath([
			'appliedOn', doc.id
		], doc.rev, event);
	}

	const isAppliedOn = (event, docId) => {
		return !!(event.appliedOn && event.appliedOn[docId]);
	}

	const markActionAsError = (event, err) => {
		return mainDb.put(R.merge(event, {
			status: "error",
			error: err
		}));
	}

	const handleEvent = async(event) => {
		const {action} = event;
		const notAppliedOnDocIds = event.relevantDocsIds.filter(docId => !isAppliedOn(event, docId));
		if (!actionHandlersKeys.includes(action.type) || notAppliedOnDocIds.length === 0) {
			return;
		}

		try {
			const relevantDocsToAdd = notAppliedOnDocIds.filter(docId => {
				return action.doc._id === docId && !action.doc._rev
			}).map(docId => {
				return {_id: docId, type: action.doc.type}
			});

      if(relevantDocsToAdd.length > 0){
        for(d of relevantDocsToAdd){
          await publicDb.get(d._id).then(doc => {
            if(doc && doc._rev){
              throw "Already added doc";
            }
          }).catch(e => {
            if(e === "Already added doc"){
              throw e;
            }
          })
        }
      }


			const relevantDocsToUpdate = (await publicDb.allDocs({
				include_docs: true,
				keys: notAppliedOnDocIds.filter(docId => action.doc._id !== docId || action.doc._rev)
			})).rows.map(d => d.doc);
			const relevantDocs = [
				...relevantDocsToAdd,
				...relevantDocsToUpdate
			];
			if (relevantDocs.some(doc => {
				return doc == undefined || doc.error
			})) {
				throw "Missing document";
			}

			const updatedDocs = relevantDocs.map(doc => actionHandlers[doc.type][action.type](doc, action)).filter(doc => !relevantDocs.includes(doc));
			const response = updatedDocs.length > 0
				? await publicDb.bulkDocs(updatedDocs)
				: [];

			const appliedOnData = [
				...relevantDocs.filter(d => d).map(d => {
					return {id: d._id, rev: d._rev}
				}),
				...response
			];

			let updatedEvent = event;
			if (appliedOnData.length > 0) {
				updatedEvent = appliedOnData.reduce(updateEventAppliedOn, updatedEvent);
			}

			if (updatedEvent !== event) {
				await mainDb.put(updatedEvent);
			}

		} catch (e) {
			console.log(e);
			await markActionAsError(event, e);
		}
	}

	const handleEvents = async() => {
    const events = await getInProcessEvents();
    console.log("In Process Events " + events.length);
    for (event of events) {
      await handleEvent(event);
    }
	}

	return () => runFor(handleEvents, 1000 * 60 * 15, "In Process Events Handler");
}

module.exports = createActionHandler;
