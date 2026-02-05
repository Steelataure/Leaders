package esiea.hackathon.leaders;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LeadersApplication {

    // Définition du logger
    private static final Logger LOGGER = LogManager.getLogger();

    public static void main(String[] args) {
        LOGGER.info("Démarrage de l'application LeadersApplication...");
 
        SpringApplication.run(LeadersApplication.class, args);
        LOGGER.info("L'application a démarré avec succès ! Elle est disponible sur http://localhost:8085/");
    }
}