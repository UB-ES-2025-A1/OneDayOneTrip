from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from typing import List, Optional
from app.models.trip_model import TripModel
from app.models.trip_create_in import TripCreateIn
from app.services.image_service import upload_image_to_imgbb
from app.services.mongo_service import save_trip, get_all_trips, get_trip_by_id, get_trip_rating_stats
from pymongo import ReturnDocument
from app.services.mongo_service import save_trip, get_all_trips, get_trip_by_id, get_trip_rating_stats, trips_collection


router = APIRouter(prefix="/trips", tags=["Trips"])


# Ordre desitjat de les 6 rutes
ORDERED_TITLES = [
    "Un dia per València",
    "Barcelona en un dia",
    "Ruta gastronòmica per Madrid",
    "Descobrint Sevilla",
    "Passeig exprés per Lisboa",
    "Ruta històrica per Roma",
]
title_to_order = {t: i for i, t in enumerate(ORDERED_TITLES)}

DEFAULT_TRIPS: List[dict] = [
    {
        "title": "Un dia per València",
        "description": "Descobreix València en profunditat amb una ruta que combina història, arquitectura i zones verdes. Un dia ple de colors, sabors i panoràmiques inoblidables.",
        "category": "Cultural, arquitectònica",
        "tags": ["història", "arquitectura", "ciutat de les arts"],
        "author": "Maria González",
        "city": "València",
        "region": "Comunitat Valenciana",
        "country": "Espanya",
        "trip_points": [
            {
            "title": "Ciutat de les Arts i les Ciències",
            "description": "Complex futurista icònic de València. Visita l'Hemisfèric, el Museu de les Ciències Príncipe Felipe i passeja per l'Umbracle, gaudint de jardins i escultures modernes.",
            "coordinates": {"lat": 39.4549, "lng": -0.3512}
        },
        {
            "title": "L'Oceanogràfic",
            "description": "L'aquari més gran d'Europa, amb ecosistemes marins de tot el món i espectacles d'animals marins, perfecte per a grans i petits.",
            "coordinates": {"lat": 39.4553, "lng": -0.3450}
        },
        {
            "title": "Jardí del Túria",
            "description": "Passeig verd que travessa la ciutat pel llit del riu convertit en parc. Ideal per caminar, relaxar-se i contemplar fonts, escultures i zones de joc.",
            "coordinates": {"lat": 39.4680, "lng": -0.3800}
        },
        {
            "title": "Mercat Central",
            "description": "Mercat modernista amb productes locals frescos. Deixa't seduir pels colors, aromes i l’ambient animat dels venedors i clients.",
            "coordinates": {"lat": 39.4755, "lng": -0.3763}
        },
        {
            "title": "Plaça de la Reina i Catedral de València",
            "description": "El cor històric de la ciutat. Pugeu al campanar del Micalet per gaudir de vistes panoràmiques i visita la catedral amb la Capella del Sant Calze.",
            "coordinates": {"lat": 39.4751, "lng": -0.3752}
        },
        

        ],
        "distance": 7,
        "duration": "5 hores",
        "difficulty": "Fàcil",
        "recommendedSeason": "Primavera",
        "coverImage": "https://live.staticflickr.com/8054/8149993271_873ab5f9c2_b.jpg",
        "gallery": [
                    "https://thumbs.dreamstime.com/b/valencia-micalet-cathedral-88368594.jpg",
                    "https://www.mistos.es/wp-content/uploads/2023/08/iStock-486832916.jpg",
                    "https://www.visitvalencia.com/sites/default/files/media/media-images/images/Mercado-Central-VV-18577_1024-%20Foto_FANDI.jpg"],
        "routeMap": None,
        "order": title_to_order["Un dia per València"],
    },
    {
        "title": "Barcelona en un dia",
        "description": "Descobreix Barcelona amb una ruta que combina modernisme, història i panoràmiques. Un dia ple de carrers emblemàtics, arquitectura icònica i vistes impressionants.",
        "category": "Cultural, arquitectònica",
        "tags": ["modernisme", "història"],
        "author": "Pedro Martínez",
        "city": "Barcelona",
        "region": "Catalunya",
        "country": "Espanya",
        "trip_points": [
            {
                "title": "Sagrada Família",
                "description": "La basílica inacabada de Gaudí, amb torres impressionants i detalls arquitectònics únics. Ideal per fotos i visites guiades.",
                "coordinates": {"lat": 41.4036, "lng": 2.1744}
            },
            {
                "title": "Plaça Catalunya",
                "description": "Inici de la ruta i enllaç amb Passeig de Gràcia.",
                "coordinates": {"lat": 41.387, "lng": 2.17},
            },
            {
                "title": "Barri Gòtic",
                "description": "Calles estrets i places amb història. Descobreix la Catedral de Barcelona i petits racons medievals amb encant.",
                "coordinates": {"lat": 41.3839, "lng": 2.1765}
            },
            {
                "title": "Parc de la Ciutadella",
                "description": "Final relaxant amb llac, cascada i natura.",
                "coordinates": {"lat": 41.388, "lng": 2.186},
            },
            {
                "title": "Camp Nou",
                "description": "Estadi del FC Barcelona, un dels més grans d'Europa.",
                "coordinates": {"lat": 41.3809, "lng": 2.1228},
            }
        ],
        "distance": 8,
        "duration": "6 hores",
        "difficulty": "Mitjana",
        "recommendedSeason": "Primavera",
        "coverImage": "https://media.architecturaldigest.com/photos/56328adbc0f017f231baf0ac/master/pass/sagrada-familia.jpg",
        "gallery": ["https://urbansabadell.com/wp-content/uploads/2020/03/Visit-Plaza-Catalunya.jpg",
                    "https://a.cdn-hotels.com/gdcs/production198/d1189/28ebaee8-6546-44cc-aa20-6791ac277453.jpg",
                    "https://hispani.co/wp-content/uploads/2023/11/camp-nou-stadium-sport-football-benches-audience-field-tourism-barcelona-catalonia-spain.jpg"],
        "routeMap": None,
        "order": title_to_order["Barcelona en un dia"],
    },
    {
        "title": "Ruta gastronòmica per Madrid",
        "description": "Tapeig, mercats i gastronomia tradicional per descobrir Madrid amb tots els sentits. Una ruta que combina tapes, vermut i dolços típics.",
        "category": "Gastronomia, urbana",
        "tags": ["tapes", "mercats", "tradició"],
        "author": "Juana López",
        "city": "Madrid",
        "region": "Comunitat de Madrid",
        "country": "Espanya",
        "trip_points": [
            {
                "title": "Mercat de San Miguel",
                "description": "Temple del tapeig: ostres, croquetes i vi.",
                "coordinates": {"lat": 40.4155, "lng": -3.7083},
            },
            {
                "title": "La Latina (Cava Baja)",
                "description": "Bars mítics de tapes i ambient de tarda.",
                "coordinates": {"lat": 40.4115, "lng": -3.7098},
            },
            {
                "title": "Pastisseries i Chocolateries al centre",
                "description": "Degusta xocolata amb xurros i altres dolços típics madrilenys, un clàssic imprescindible.",
                "coordinates": {"lat": 40.4169, "lng": -3.7033}
            },
        ],
        "distance": 5,
        "duration": "4 hores",
        "difficulty": "Fàcil",
        "recommendedSeason": "Tardor",
        "coverImage": "https://www.estaentumundo.com/wp-content/imagenes/2018/03/tapas-madrid-750x500.jpg",
        "gallery": ["https://descubriendomadrid.com/paneldecontrol/wp-content/uploads/2019/01/ruta-gastronomica-madrid-3.jpg",
                    "https://www.livingmadrid.com/wp-content/uploads/2020/02/mercado-de-san-miguel-adolfo-gosalvez-living-madrid-04-1536x1025.jpg"],
        "routeMap": None,
        "order": title_to_order["Ruta gastronòmica per Madrid"],
    },
    {
        "title": "Descobrint Sevilla",
        "description": "Ruta cultural per Sevilla que combina història, art i relax. Passeja per monuments, places i racons amb encant amb una ruta completa de mig dia.",
        "category": "Cultural, patrimoni",
        "tags": ["catedral", "barri antic", "rius"],
        "author": "Lourdes Fernández",
        "city": "Sevilla",
        "region": "Andalusia",
        "country": "Espanya",
        "trip_points": [
            {
                "title": "Catedral i La Giralda",
                "description": "Patrimoni de la Humanitat; vistes increïbles des de la Giralda.",
                "coordinates": {"lat": 37.3861, "lng": -5.9928},
            },
            {
                "title": "Plaza de España (Parc de María Luisa)",
                "description": "Joia arquitectònica del 1929, ideal per fotos i relax.",
                "coordinates": {"lat": 37.3772, "lng": -5.9869},
            },
            {
                "title": "Barrio de Santa Cruz",
                "description": "Barri antic amb carrers estrets, patis amb flors i racons plens d’encant, perfecte per perdre’s i gaudir de l’ambient sevillà.",
                "coordinates": {"lat": 37.3870, "lng": -5.9880}
            },
            {
                "title": "Torre del Oro i riu Guadalquivir",
                "description": "Història i vistes del riu, amb oportunitat de fer fotos i passeig tranquil al costat del riu.",
                "coordinates": {"lat": 37.3744, "lng": -5.9969}
            }
        ],
        "distance": 6,
        "duration": "7 hores",
        "difficulty": "Difícil",
        "recommendedSeason": "Primavera",
        "coverImage": "https://th.bing.com/th/id/R.756df7df9c567148ef25303fe5e6dcd6?rik=FCX09fvWm6ulew&riu=http%3a%2f%2fsevillaintercambio.com%2fwp-content%2fuploads%2fPlaza-Espa%c3%b1a-Sevilla.jpg&ehk=eo3yevR0cdGsjmz04lMxmOY5qr3HucYYJ5Srk%2blgOjc%3d&risl=&pid=ImgRaw&r=0",
        "gallery": ["https://res.cloudinary.com/hello-tickets/image/upload/c_limit,f_auto,q_auto,w_1300/v1614788019/oh9pshspvtvi1yqjbmws.jpg",
                    "https://th.bing.com/th/id/R.5ae83423a673a5a0526e293f61b12046?rik=JEWJhzWI50MBig&pid=ImgRaw&r=0"
                    ],
        "routeMap": None,
        "order": title_to_order["Descobrint Sevilla"],
    },
    {
        "title": "Passeig exprés per Lisboa",
        "description": "Ruta urbana i panoràmica per Lisboa combinant tramvies, miradors, barris antics i gastronomia local en un dia complet.",
        "category": "Cultural, miradors",
        "tags": ["tramvia 28", "miradors", "baix a peu"],
        "author": "Clara Rodríguez",
        "city": "Lisboa",
        "region": "Lisboa",
        "country": "Portugal",
        "trip_points": [
            {
                "title": "Praça do Comércio",
                "description": "Porta d’entrada a la Baixa, oberta al riu Tajo.",
                "coordinates": {"lat": 38.7079, "lng": -9.1366},
            },
            {
                "title": "Miradouro da Senhora do Monte",
                "description": "Un dels millors miradors de la ciutat.",
                "coordinates": {"lat": 38.7225, "lng": -9.1336},
            },
            {
                "title": "Alfama i Castell de São Jorge",
                "description": "Barri antic amb carrers laberíntics i vistes des del castell.",
                "coordinates": {"lat": 38.7139, "lng": -9.1335},
            },
            {
                "title": "Tramvia 28",
                "description": "Recorregut clàssic pels barris històrics",
                "coordinates": {"lat": 38.7130, "lng": -9.1390},
            }
        ],
        "distance": 7,
        "duration": "6 hores",
        "difficulty": "Fàcil",
        "recommendedSeason": "Primavera",
        "coverImage": "https://www.transfeero.com/wp-content/uploads/2020/07/lisbon-2048x1366.jpg",
        "gallery": ["https://tse3.mm.bing.net/th/id/OIF.WwRoawBybooUe2i4nRNKeA?rs=1&pid=ImgDetMain&o=7&rm=3",
                    "https://pasaportenomada.es/wp-content/uploads/2024/08/lisboa-en-3-dias-mirador-santa-luzia.webp"],
        "routeMap": None,
        "order": title_to_order["Passeig exprés per Lisboa"],
    },
    {
        "title": "Ruta històrica per Roma",
        "description": "Descobreix els grans clàssics de Roma: monuments, fòrum, palaus i fonts en una ruta completa a peu.",
        "category": "Història, clàssica",
        "tags": ["fòrum", "coliseu", "història"],
        "author": "Guilia Rossi",
        "city": "Roma",
        "region": "Laci",
        "country": "Itàlia",
        "trip_points": [
            {
                "title": "Colosseu",
                "description": "Amfiteatre Flavi: icona de Roma antiga.",
                "coordinates": {"lat": 41.8902, "lng": 12.4922},
            },
            {
                "title": "Fontana di Trevi",
                "description": "Clàssic desig amb moneda a una de les fonts més famoses del món.",
                "coordinates": {"lat": 41.9009, "lng": 12.4833},
            },
            {
                "title": "Fòrum Romà i Palatí",
                "description": "Centre polític i social de l'antiga Roma.",
                "coordinates": {"lat": 41.8925, "lng": 12.4853},
            },
            {
                "title": "Panteó de Roma",
                "description": "Temple romà ben conservat, ara església.",
                "coordinates": {"lat": 41.8986, "lng": 12.4769},
            },
            {
                "title": "Piazza Navona",
                "description": "Plaça barroca amb fonts, cafès i ambient animat; perfecte per descansar i prendre fotos.",
                "coordinates": {"lat": 41.8992, "lng": 12.4731}
            },
            {
                "title": "Castel Sant'Angelo",
                "description": "Fortalesa històrica amb museu i vistes panoràmiques del riu Tíber i la ciutat.",
                "coordinates": {"lat": 41.9039, "lng": 12.4663}
            },
        ],
        "distance": 6,
        "duration": "9 hores",
        "difficulty": "Fàcil",
        "recommendedSeason": "Primavera",
        "coverImage": "https://www.enroma.com/wp-content/uploads/2017/02/Tour-Coliseo-Foro-y-Palatino-3-2048x1365.jpg",
        "gallery": ["https://www.turismoroma.it/sites/default/files/Fontane%20-%20Fontana%20di%20Trevi_1920x1080mba-07410189%20%C2%A9%20Clickalps%20_%20AGF%20foto.jpg",
                    "https://th.bing.com/th/id/R.294b2a5c800b1e35186a071d61c21187?rik=1i0nhGPww2aSqw&riu=http%3a%2f%2ffamouswonders.com%2fwp-content%2fuploads%2f2009%2f03%2fforum_romanum_rom.jpg&ehk=k4MO%2f8i0pC7li3vViXJSO8BT0PkTgAGfcLG7e%2bl5FXE%3d&risl=&pid=ImgRaw&r=0",
                    "https://th.bing.com/th/id/R.e191a76b69e777a939e7ee5fb4063ab5?rik=BkUvj%2fcvp0YiHw&riu=http%3a%2f%2fwww.roundalia.com%2fwp-content%2fuploads%2f2015%2f03%2fPanteon-Roma.jpg&ehk=TqX28leh61%2fUJlxhbsSwqJaBtuCUg2eq0KoRtYDJgJ8%3d&risl=&pid=ImgRaw&r=0"                    ],
        "routeMap": None,
        "order": title_to_order["Ruta històrica per Roma"],
    },
]

def ensure_seed_trips():
    """
    Upsert per TÍTOL: actualitza o crea cadascuna de les 6 rutes del seed,
    incloent-hi coverImage, gallery, author, order, etc.
    """
    # (Opcional) index únic per títol per evitar duplicats accidentals
    try:
        trips_collection.create_index("title", unique=True)
    except Exception:
        pass

    for t in DEFAULT_TRIPS:
        # Normalitza l'author a dict (per si alguna entrada vella era string)
        author = t.get("author")
        if isinstance(author, str):
            author = {"userId": f"uid_{t['title'][:8].lower()}", "name": author, "profilePic": None}

        body = {
            "title": t["title"],
            "description": t["description"],
            "category": t.get("category"),
            "tags": t.get("tags", []),
            "author": author,
            "city": t["city"],
            "region": t.get("region"),
            "country": t.get("country"),
            "routeMap": t.get("routeMap"),
            "trip_points": t["trip_points"],
            "distance": t.get("distance"),
            "duration": t.get("duration"),
            "difficulty": t.get("difficulty"),
            "recommendedSeason": t.get("recommendedSeason"),
            "coverImage": t.get("coverImage"),
            "gallery": t.get("gallery", []),
            "order": t.get("order", 999),
        }

        trips_collection.find_one_and_update(
            {"title": t["title"]},      # clau d'upsert
            {"$set": body},             # actualitza tots els camps
            upsert=True,
            return_document=ReturnDocument.AFTER
        )



@router.get("/")
def list_trips(include_stats: bool = False):
    ensure_seed_trips()
    trips = get_all_trips()

    trips = [t for t in trips if t.get("title") in title_to_order]
    for t in trips:
        t["order"] = title_to_order.get(t.get("title"), 999)
    trips.sort(key=lambda x: (x.get("order", 999), x.get("title", "")))

    if include_stats:
        for t in trips:
            stats = get_trip_rating_stats(t["_id"])
            t.update(stats)
    return trips


@router.get("/{trip_id}")
def get_trip(trip_id: str):
    trip = get_trip_by_id(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    trip.update(get_trip_rating_stats(trip_id))
    return trip


@router.post(
    "/",
    summary="Crear una trip (multipart con JSON + imágenes)",
    description="""
    Este endpoint acepta:
    - `trip_json`: JSON con los datos principales del viaje (sin imágenes)
    - `cover`: archivo de imagen principal
    - `gallery`: una o más imágenes para la galería
    - `point_images`: imágenes para los puntos del recorrido (en el mismo orden que 'trip_points')
    """
)
async def create_trip_multipart(
    trip_json: str = Form(...),
    cover: Optional[UploadFile] = File(None),
    gallery: Optional[List[UploadFile]] = File(None),
    point_images: Optional[List[UploadFile]] = File(None)
):
    """
    Enviar:
    - trip_json: JSON string de TripCreateIn (sin imágenes).
    - cover: 1 archivo (opcional)
    - gallery: N archivos (opcional, usar misma key 'gallery' varias veces)
    - point_images: N archivos (opcional, usar misma key 'point_images' varias veces, orden = índices de trip_points)
    """
    try:
        data = TripCreateIn.model_validate_json(trip_json)

        # 1) Subidas a ImgBB
        cover_url = upload_image_to_imgbb(cover) if cover else None
        gallery_urls = [upload_image_to_imgbb(f) for f in (gallery or [])]

        # 2) Mapear imágenes de puntos por orden
        points_with_images = []
        for i, p in enumerate(data.trip_points):
            img_url = None
            if point_images and i < len(point_images) and point_images[i] is not None:
                img_url = upload_image_to_imgbb(point_images[i])
            points_with_images.append({**p.dict(), "image": img_url})

        # 3) Construir TripModel para guardar
        trip_to_store = TripModel(
            title=data.title,
            description=data.description,
            category=data.category,
            tags=data.tags,
            author=data.author.dict(),
            city=data.city,
            region=data.region,
            country=data.country,
            routeMap=data.routeMap,
            trip_points=points_with_images,
            distance=data.distance,
            duration=data.duration,
            difficulty=data.difficulty,
            recommendedSeason=data.recommendedSeason,
            coverImage=cover_url,
            gallery=gallery_urls,
        )

        inserted_id = save_trip(trip_to_store.dict())
        return {"message": "Trip creada correctamente", "trip_id": inserted_id, "trip": trip_to_store}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
