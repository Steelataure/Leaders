package esiea.hackathon.leaders;

import org.springframework.boot.SpringApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableScheduling
public class LeadersApplication {

	public static void main(String[] args) {
		SpringApplication.run(LeadersApplication.class, args);
	}

	@jakarta.annotation.PostConstruct
	public void onStart() {
		System.out.println("DEBUG: LeadersApplication successfully started on Railway!");
	}

}
