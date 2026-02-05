import { test, expect } from '@playwright/test';

test.describe('Authentification et Inscription', () => {
  
  // Vérification de la disponibilité du serveur backend avant de commencer
  test.beforeAll(async ({ request }) => {
    try {
      const response = await request.get('http://localhost:8085');
      if (!response.ok() && response.status() !== 404) { 
        console.warn(`Attention: Le serveur répond avec le statut ${response.status()}`);
      }
    } catch (error) {
      throw new Error('Le serveur backend (8085) est inaccessible. Lancez-le avant les tests.');
    }
  });

  // Action répétée avant chaque test
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    const startBtn = page.getByTestId('startMainMenu');
    await expect(startBtn).toHaveText('Commencer'); // On va sur le lobby
    await expect(startBtn).toBeVisible();
    await startBtn.click();
  });

  test('1. le bouton de connexion et le menu sont disponibles', async ({ page }) => {
    const connUserBtn = page.getByTestId('connexionUserButton');
    await expect(connUserBtn).toHaveText('CONNEXION');
    await connUserBtn.click();

    const dropdownItem = page.getByTestId('connexionButtonDropdown');
    await expect(dropdownItem).toHaveText('CONNEXION');
    await expect(dropdownItem).toBeVisible();
    await dropdownItem.click();
    
    const title = page.getByTestId('connexionPopUpTitle');
    await expect(title).toHaveText('IDENTIFICATION');
    await expect(title).toBeVisible();
  });

  test('2. navigation vers le formulaire d\'inscription', async ({ page }) => {
    const connUserBtn = page.getByTestId('connexionUserButton');
    await expect(connUserBtn).toHaveText('CONNEXION');
    await connUserBtn.click();

    const dropdownItem = page.getByTestId('connexionButtonDropdown');
    await expect(dropdownItem).toHaveText('CONNEXION');
    await dropdownItem.click();
    
    const signupBtn = page.getByTestId('registerButton');
    await expect(signupBtn).toHaveText('Créer un nouveau profil');
    await expect(signupBtn).toBeVisible();
    await signupBtn.click();
    
    await expect(page.getByTestId('connexionPopUpTitle')).toBeVisible();
  });

  test('3. échec de l\'inscription avec des données manquantes ou invalides', async ({ page }) => {
    const connUserBtn = page.getByTestId('connexionUserButton');
    await expect(connUserBtn).toHaveText('CONNEXION');
    await connUserBtn.click();

    const dropdownItem = page.getByTestId('connexionButtonDropdown');
    await expect(dropdownItem).toHaveText('CONNEXION');
    await dropdownItem.click();
    
    await page.getByTestId('registerButton').click();

    await page.getByTestId('connexionProfilButton').click();
    const erreurInscription =  page.getByTestId('messageErreurConnexion_Inscription')
    await expect(erreurInscription).toBeVisible();
    await expect(erreurInscription).toHaveText("Échec de l'inscription.");
  });

  test('4. inscription réussie avec un nouveau compte unique', async ({ page }) => {
    const connUserBtn = page.getByTestId('connexionUserButton');
    await expect(connUserBtn).toHaveText('CONNEXION');
    await connUserBtn.click();

    const dropdownItem = page.getByTestId('connexionButtonDropdown');
    await expect(dropdownItem).toHaveText('CONNEXION');
    await dropdownItem.click();

    await page.getByTestId('registerButton').click();

    const uniqueId = `CMD_${Date.now()}`;
    const idInput = page.getByTestId('connexionIdentifiantInput');
    await expect(idInput).toHaveAttribute('placeholder', /COMMANDEUR/);
    await idInput.fill(uniqueId);

    const pseudoInput = page.getByTestId('connexionPseudoInput');
    await expect(pseudoInput).toHaveAttribute('placeholder', 'PSEUDO');
    await pseudoInput.fill(`Soldat_${Date.now()}`);
   
    const mdpInput = page.getByTestId('connexionMdpInput');
    await expect(mdpInput).toHaveAttribute('placeholder', '••••••••');
    await mdpInput.fill('Securite123!');
    
    const profilBtn = page.getByTestId('connexionProfilButton');
    await expect(profilBtn).toHaveText("S'ENROLER");
    await profilBtn.click();

    const messageSuccesConnexion =  page.getByTestId('messageSuccesConnexion')
    await expect(messageSuccesConnexion).toBeVisible();
    await expect(messageSuccesConnexion).toHaveText("Compte créé avec succès ! Veuillez vous connecter.");
  });

  test('5. échec de la connexion avec des identifiants erronés', async ({ page }) => {
    const connUserBtn = page.getByTestId('connexionUserButton');
    await expect(connUserBtn).toHaveText('CONNEXION');
    await connUserBtn.click();

    const dropdownItem = page.getByTestId('connexionButtonDropdown');
    await expect(dropdownItem).toHaveText('CONNEXION');
    await dropdownItem.click();

    await page.getByTestId('connexionIdentifiantInput').fill('INCONNU_RECRUE');
    await page.getByTestId('connexionMdpInput').fill('MauvaisPassword99');
    
    const profilBtn = page.getByTestId('connexionProfilButton');
    await expect(profilBtn).toHaveText('ACCÉDER');
    await profilBtn.click();

    const erreurConnexion =  page.getByTestId('messageErreurConnexion_Inscription')
    await expect(erreurConnexion).toBeVisible();
    await expect(erreurConnexion).toHaveText("Échec de la connexion. Vérifiez vos identifiants.");
  });

  test('6. connexion réussie avec un compte existant', async ({ page }) => {
    // 1. Création d'un compte unique pour s'assurer qu'il existe
    const uniqueId = `USER_${Date.now()}`;
    const pseudo = `Pseudo_${Date.now()}`; // Variable créée pour être réutilisée
    const password = 'Password123!';

    // Navigation vers inscription
    await page.getByTestId('connexionUserButton').click();
    await page.getByTestId('connexionButtonDropdown').click();
    await page.getByTestId('registerButton').click();

    // Remplissage inscription
    await page.getByTestId('connexionIdentifiantInput').fill(uniqueId);
    await page.getByTestId('connexionPseudoInput').fill(pseudo);
    await page.getByTestId('connexionMdpInput').fill(password);
    await page.getByTestId('connexionProfilButton').click();

    // Attendre le message de succès d'inscription
    await expect(page.getByTestId('messageSuccesConnexion')).toBeVisible();

    // 2. Procédure de CONNEXION réelle
    await page.getByTestId('connexionIdentifiantInput').fill(uniqueId);
    await page.getByTestId('connexionMdpInput').fill(password);
    
    const profilBtn = page.getByTestId('connexionProfilButton');
    await expect(profilBtn).toHaveText('ACCÉDER');
    await profilBtn.click();

    // 3. Vérification finale
    // On vérifie que le bouton de connexion affiche maintenant le PSEUDO
    const connUserBtn = page.getByTestId('connexionUserButton');
    await expect(connUserBtn).toHaveText(pseudo.toUpperCase());
  });

  test('7. deconnexion réussie avec un compte existant', async ({ page }) => {
    // 1. Création d'un compte unique pour s'assurer qu'il existe
    const uniqueId = `USER_${Date.now()}`;
    const pseudo = `Pseudo_${Date.now()}`; // Variable créée pour être réutilisée
    const password = 'Password123!';

    // Navigation vers inscription
    await page.getByTestId('connexionUserButton').click();
    await page.getByTestId('connexionButtonDropdown').click();
    await page.getByTestId('registerButton').click();

    // Remplissage inscription
    await page.getByTestId('connexionIdentifiantInput').fill(uniqueId);
    await page.getByTestId('connexionPseudoInput').fill(pseudo);
    await page.getByTestId('connexionMdpInput').fill(password);
    await page.getByTestId('connexionProfilButton').click();

    // Attendre le message de succès d'inscription
    await expect(page.getByTestId('messageSuccesConnexion')).toBeVisible();

    // 2. Procédure de CONNEXION réelle
    await page.getByTestId('connexionIdentifiantInput').fill(uniqueId);
    await page.getByTestId('connexionMdpInput').fill(password);
    
    const profilBtn = page.getByTestId('connexionProfilButton');
    await expect(profilBtn).toHaveText('ACCÉDER');
    await profilBtn.click();

    // 3. Vérification finale
    // On vérifie que le bouton de connexion affiche maintenant le PSEUDO
    const connUserBtn = page.getByTestId('connexionUserButton');
    await expect(connUserBtn).toHaveText(pseudo.toUpperCase());

    await page.getByTestId('connexionUserButton').click();
    await page.getByTestId('deconnexionButtonDropdown').click();

    await expect(connUserBtn).toHaveText('CONNEXION');
  });

});