deploy-stage:
	rm -rf dist/
	npm run-script build-staging
	gsutil -m cp -r dist/* gs://app.truckspyapi.com/
	gsutil setmeta -h "Cache-Control:no-cache, max-age=0"  gs://app.truckspyapi.com/index.html

deploy-prod:
	rm -rf dist/
	npm run-script build-prod
	gsutil -m cp -r dist/* gs://app.truckspy.io/
	gsutil setmeta -h "Cache-Control:no-cache, max-age=0"  gs://app.truckspy.io/index.html
