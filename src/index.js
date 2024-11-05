	import { initializeApp } from "firebase/app";
	import { doc, onSnapshot, getFirestore, collection, getDocs, addDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

	console.log('started with webpack!');

	//Récupération des accès a Firebase configurer dans le .env
	const firebaseConfig = {
	apiKey: process.env.apiKey,
	authDomain: process.env.authDomain,
	projectId: process.env.projectId,
	storageBucket: process.env.storageBucket,
	messagingSenderId: process.env.messagingSenderId,
	appId: process.env.appId
	};

	//Initialisation de l'app
	const app = initializeApp(firebaseConfig);
	const db = getFirestore(app);
	const facturesCollection = collection(db, 'factures');

	// Gérer l'affichage et le masquage du formulaire
	document.getElementById('showFormButton').addEventListener('click', () => {
		document.getElementById('addFacture').style.display = 'block';
		document.getElementById('showFormButton').style.display = 'none';
	});

	document.getElementById('cancelFormButton').addEventListener('click', () => {
		document.getElementById('addFacture').style.display = 'none';
		document.getElementById('showFormButton').style.display = 'block';
	});

	//Méthode qui rafraichie la page après toutes modification en BDD
	onSnapshot(facturesCollection, (snapshot) => {
		let factures = [];
		snapshot.docs.map((doc) => {
			factures.push({...doc.data(), id: doc.id});
		});
		showFactures(factures);
	});

	//Méthode qui récupère les Factures en BDD
	const getFactures = async () => {
		const facturesSnapshot = await getDocs(facturesCollection);
		let factures = [];
		facturesSnapshot.docs.map((doc) => {
			factures.push({...doc.data(), id: doc.id});
		});
		return factures;
		}

		document.querySelector("#addFacture").addEventListener('submit', async (event) => {
		event.preventDefault();

		let number = document.querySelector('#number').value;
		let status = document.querySelector('#status').value;
		let cost = parseFloat(document.querySelector('#cost').value);

		if (number !== "" && status !== "" && !isNaN(cost)) {
			try {
			await addDoc(facturesCollection, {
				'number': number,
				'status': status,
				'cost': cost,
				'date': serverTimestamp()
			});

			// Vider les champs du formulaire et masquer le formulaire
			document.querySelector('#number').value = "";
			document.querySelector('#status').value = "";
			document.querySelector('#cost').value = "";
			document.getElementById('addFacture').style.display = 'none';
			document.getElementById('showFormButton').style.display = 'block';
			
			} catch (error) {
			console.error("Erreur lors de l'ajout de la facture:", error);
			alert("Une erreur est survenue. Veuillez réessayer.");
			}
		} else {
			alert('Merci de renseigner tous les champs !');
		}
	});

	//Méthode pour afficher le tableau
	const showFactures = (factures) => {
		const tableBody = document.querySelector('#listFactures tbody');
		tableBody.innerHTML = '';

		factures.forEach((facture) => {
			//Création de la ligne
			const tr = document.createElement('tr');

			//Colonne Number
			const tdNumber = document.createElement('td');
			tdNumber.textContent = facture.number;
			tr.appendChild(tdNumber);

			//Colonne Statut
			const tdStatus = document.createElement('td');
			tdStatus.textContent = facture.status;
			tdStatus.className = facture.status === 'A payer' ? 'red' : 'green';
			tr.appendChild(tdStatus);

			//Colonne Coût
			const tdCost = document.createElement('td');
			tdCost.textContent = `${facture.cost.toFixed(2)} €`;
			tr.appendChild(tdCost);

			//Colonne Action
			const tdAction = document.createElement('td');
			
			//Création du bouton edit
			const editButton = document.createElement('button');
			editButton.textContent = 'Éditer';
			editButton.className = 'editFacture';
			editButton.addEventListener('click', () => enableEditMode(facture, tr));
			tdAction.appendChild(editButton);

			//Création du bouton delete
			const deleteButton = document.createElement('button');
			deleteButton.textContent = 'Supprimer';
			deleteButton.className = 'deleteFacture';
			deleteButton.setAttribute('data-id', facture.id);
			deleteButton.addEventListener('click', async () => {
				try {
					await deleteDoc(doc(db, "factures", facture.id));
				} catch (error) {
					console.error("Erreur lors de la suppression de la facture:", error);
					alert("Impossible de supprimer la facture. Veuillez réessayer.");
				}
			});
			tdAction.appendChild(deleteButton);

			tr.appendChild(tdAction);
			tableBody.appendChild(tr);
		});
	};

	
	//Méthode pour editer une ligne
	const enableEditMode = (facture, tr) => {
		tr.innerHTML = '';

		const tdNumber = document.createElement('td');
		const numberInput = document.createElement('input');
		numberInput.type = 'text';
		numberInput.value = facture.number;
		tdNumber.appendChild(numberInput);
		tr.appendChild(tdNumber);

		const tdStatus = document.createElement('td');
		const statusSelect = document.createElement('select');
		["A payer", "Payé"].forEach(optionValue => {
			const option = document.createElement('option');
			option.value = optionValue;
			option.textContent = optionValue;
			if (optionValue === facture.status) option.selected = true;
			statusSelect.appendChild(option);
		});
		tdStatus.appendChild(statusSelect);
		tr.appendChild(tdStatus);

		const tdCost = document.createElement('td');
		const costInput = document.createElement('input');
		costInput.type = 'number';
		costInput.value = facture.cost;
		costInput.step = '0.01';
		costInput.min = '0';
		tdCost.appendChild(costInput);
		tr.appendChild(tdCost);

		const tdAction = document.createElement('td');
		const saveButton = document.createElement('button');
		saveButton.textContent = 'Enregistrer';
		saveButton.addEventListener('click', async () => {
			try {
			await updateDoc(doc(db, "factures", facture.id), {
				number: numberInput.value,
				status: statusSelect.value,
				cost: parseFloat(costInput.value),
			});
			const factures = await getFactures();
			showFactures(factures);
			} catch (error) {
			console.error("Erreur lors de la mise à jour de la facture:", error);
			alert("Erreur de mise à jour. Veuillez réessayer.");
			}
		});
		tdAction.appendChild(saveButton);

		const cancelButton = document.createElement('button');
		cancelButton.textContent = 'Annuler';
		cancelButton.addEventListener('click', async () => {
			const factures = await getFactures();
			showFactures(factures);
		});
		tdAction.appendChild(cancelButton);

		tr.appendChild(tdAction);
	};
