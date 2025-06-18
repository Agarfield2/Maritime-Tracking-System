#------------------------------------------------------------
#        Script MySQL.
#------------------------------------------------------------


#------------------------------------------------------------
# Table: bateau
#------------------------------------------------------------

CREATE TABLE bateau(
        id_bateau        Int  Auto_increment  NOT NULL ,
        MMSI             Varchar (9) NOT NULL ,
        IMO              Varchar (7) NOT NULL ,
        CallSign         Varchar (8) NOT NULL ,
        VesselName       Varchar (32) NOT NULL ,
        VesselType       Integer NOT NULL ,
        Length           Float NOT NULL ,
        Width            Float NOT NULL ,
        Draft            Float NOT NULL ,
        Cargo            Varchar (4) NOT NULL ,
        TransceiverClass Varchar (1) NOT NULL
	,CONSTRAINT bateau_PK PRIMARY KEY (id_bateau)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: statut
#------------------------------------------------------------

CREATE TABLE statut(
        id_statut Int  Auto_increment  NOT NULL ,
        statut    Integer NOT NULL
	,CONSTRAINT statut_PK PRIMARY KEY (id_statut)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: position_AIS
#------------------------------------------------------------

CREATE TABLE position_AIS(
        id_position  Int  Auto_increment  NOT NULL ,
        BaseDateTime Date NOT NULL ,
        LAT          Double NOT NULL ,
        LON          Double NOT NULL ,
        SOG          Float NOT NULL ,
        COG          Real NOT NULL ,
        Heading      Float NOT NULL ,
        id_statut    Int NOT NULL
	,CONSTRAINT position_AIS_PK PRIMARY KEY (id_position)

	,CONSTRAINT position_AIS_statut_FK FOREIGN KEY (id_statut) REFERENCES statut(id_statut)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: compte_admin
#------------------------------------------------------------

CREATE TABLE compte_admin(
        id_admin     Int  Auto_increment  NOT NULL ,
        nom_admin    Varchar (20) NOT NULL ,
        mot_de_passe Varchar (255) NOT NULL ,
        token        Varchar (50) NOT NULL ,
        date_token   Date NOT NULL
	,CONSTRAINT compte_admin_PK PRIMARY KEY (id_admin)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: possede
#------------------------------------------------------------

CREATE TABLE possede(
        id_position Int NOT NULL ,
        id_bateau   Int NOT NULL
	,CONSTRAINT possede_PK PRIMARY KEY (id_position,id_bateau)

	,CONSTRAINT possede_position_AIS_FK FOREIGN KEY (id_position) REFERENCES position_AIS(id_position)
	,CONSTRAINT possede_bateau0_FK FOREIGN KEY (id_bateau) REFERENCES bateau(id_bateau)
)ENGINE=InnoDB;

